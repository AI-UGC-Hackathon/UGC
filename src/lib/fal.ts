import { fal } from "@fal-ai/client";
import type { ProductImage } from "../types";

// fal-ai/veo3 image-to-video. Veo 3 Fast is the cheapest tier; it produces
// 8-second 9:16 clips at 720p with native audio (we mute it and overlay an
// ElevenLabs voiceover).
const MODEL_ID = "fal-ai/veo3/fast/image-to-video";

export type FalProgress = (msg: string, progress: number) => void;

export type FalVideoOptions = {
  apiKey: string;
  prompt: string;
  image: ProductImage;
  signal?: AbortSignal;
  onProgress?: FalProgress;
};

function dataUrlToFile(image: ProductImage): File {
  const comma = image.dataUrl.indexOf(",");
  const base64 = comma >= 0 ? image.dataUrl.slice(comma + 1) : image.dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = image.mimeType.split("/")[1] ?? "png";
  return new File([bytes], `${image.name || "reference"}.${ext}`, {
    type: image.mimeType,
  });
}

type VeoResult = {
  data?: {
    video?: { url?: string };
  };
};

export async function generateFalVideo(opts: FalVideoOptions): Promise<Blob> {
  if (!opts.apiKey) throw new Error("Missing fal.ai API key");
  if (!opts.prompt.trim()) throw new Error("Empty prompt for fal video");

  fal.config({ credentials: opts.apiKey });

  opts.onProgress?.("Uploading product image to fal.ai…", 0.05);

  let imageUrl: string;
  try {
    const file = dataUrlToFile(opts.image);
    imageUrl = await fal.storage.upload(file);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`fal.ai image upload failed: ${msg}`);
  }

  opts.onProgress?.("Submitting clip to fal.ai · Veo 3 Fast…", 0.12);

  const input = {
    prompt: opts.prompt,
    image_url: imageUrl,
    aspect_ratio: "9:16",
    duration: "8s",
    resolution: "720p",
    generate_audio: false,
  } as Record<string, unknown>;

  let result: VeoResult;
  try {
    // fal's per-model TS types are strict; we use a generic input shape.
    result = (await fal.subscribe(MODEL_ID, {
      input: input as never,
      logs: true,
      onQueueUpdate: (update: { status?: string; logs?: Array<{ message?: string }> }) => {
        const status = update.status ?? "";
        const last = update.logs?.[update.logs.length - 1]?.message;
        if (status === "IN_QUEUE") {
          opts.onProgress?.("fal.ai queued the job…", 0.18);
        } else if (status === "IN_PROGRESS") {
          opts.onProgress?.(
            last ? `fal.ai · ${last}` : "Veo 3 is rendering your clip…",
            0.45,
          );
        }
      },
    })) as VeoResult;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`fal.ai video generation failed: ${msg}`);
  }

  const videoUrl = result.data?.video?.url;
  if (!videoUrl) {
    throw new Error("fal.ai finished but did not return a video URL");
  }

  opts.onProgress?.("Downloading clip from fal.ai…", 0.85);

  const dl = await fetch(videoUrl, { signal: opts.signal });
  if (!dl.ok) {
    throw new Error(`Failed to download fal.ai video (${dl.status})`);
  }
  const blob = await dl.blob();
  opts.onProgress?.("fal.ai clip ready.", 0.95);
  return blob;
}

type SceneLite = {
  voiceLine: string;
  description: string;
  acting: string;
};

/**
 * Build a single Veo prompt out of the brief, hook, and the script's
 * scenes (description + acting + spoken lines). The uploaded product photo
 * is sent separately as the first frame.
 */
export function buildFalPrompt(opts: {
  productDescription: string;
  audience: string;
  tone: string;
  platform: string;
  angle: string;
  personaStyleNotes: string;
  hook: string;
  scenes: SceneLite[];
}): string {
  const parts: string[] = [];
  parts.push(
    `Vertical 9:16 ${opts.platform} UGC ad. Handheld smartphone aesthetic, natural lighting, real influencer energy. The creator is filming themselves with the product clearly visible — the product matches the reference image attached as the first frame.`,
  );
  parts.push(`Creator persona: ${opts.personaStyleNotes}`);
  if (opts.audience) parts.push(`Target viewer: ${opts.audience}.`);
  if (opts.angle) parts.push(`Angle: ${opts.angle}.`);
  if (opts.productDescription) {
    parts.push(`Product: ${opts.productDescription}.`);
  }

  if (opts.hook) {
    parts.push(`Opening hook on screen: "${opts.hook}".`);
  }

  if (opts.scenes.length === 0) {
    parts.push(
      `Action: creator demonstrating the product, looking into the camera with conviction.`,
    );
  } else {
    opts.scenes.forEach((s, i) => {
      const tag = opts.scenes.length > 1 ? ` Beat ${i + 1}:` : "";
      if (s.description)
        parts.push(`${tag} On screen — ${s.description}.`.trim());
      if (s.acting) parts.push(`Acting — ${s.acting}.`);
      if (s.voiceLine) parts.push(`Lip-sync line — "${s.voiceLine}".`);
    });
  }

  parts.push(
    `Tone: ${opts.tone}. Style: photoreal, organic, scroll-stopping, looks like a real person filming themselves on a phone. No on-screen text or subtitles.`,
  );
  return parts.join(" ");
}

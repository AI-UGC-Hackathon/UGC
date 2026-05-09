import type { ProductImage, Scene } from "../types";

export type ComposeMode =
  | { kind: "slideshow"; images: ProductImage[]; scenes: Scene[] }
  | { kind: "video"; source: Blob };

export type ComposeOptions = {
  mode: ComposeMode;
  hook: string;
  cta: string;
  audio: Blob;
  width?: number;
  height?: number;
  fps?: number;
  onProgress?: (p: number) => void;
};

export type ComposeResult = {
  videoBlob: Blob;
  durationMs: number;
  mimeType: string;
};

function pickMimeType(): { mime: string; ext: string } {
  const candidates = [
    { mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", ext: "mp4" },
    { mime: "video/webm;codecs=vp9,opus", ext: "webm" },
    { mime: "video/webm;codecs=vp8,opus", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
    { mime: "video/mp4", ext: "mp4" },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: "", ext: "webm" };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function loadVideo(blob: Blob): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    v.src = url;
    v.onloadedmetadata = () => resolve(v);
    v.onerror = () => reject(new Error("Failed to decode AI video"));
  });
}

function blobToAudioBuffer(blob: Blob): Promise<{
  buffer: AudioBuffer;
  context: AudioContext;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        const buf = await ctx.decodeAudioData(reader.result as ArrayBuffer);
        resolve({ buffer: buf, context: ctx });
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLVideoElement,
  W: number,
  H: number,
  scale: number,
  panX: number,
  panY: number,
) {
  const iw = "naturalWidth" in img ? img.naturalWidth : img.videoWidth;
  const ih = "naturalHeight" in img ? img.naturalHeight : img.videoHeight;
  if (!iw || !ih) return;
  const ratio = Math.max(W / iw, H / ih) * scale;
  const dw = iw * ratio;
  const dh = ih * ratio;
  const dx = (W - dw) / 2 + panX;
  const dy = (H - dh) / 2 + panY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(0.35, "rgba(0,0,0,0)");
  g.addColorStop(0.65, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  W: number,
  H: number,
  yAnchor: "top" | "bottom",
) {
  if (!text) return;
  const padding = 36;
  const maxWidth = W - padding * 2;
  ctx.font = `700 56px -apple-system, "SF Pro Display", Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = 70;
  const blockH = lines.length * lineHeight;
  const baseY = yAnchor === "top" ? 160 : H - blockH - 200;

  lines.forEach((ln, i) => {
    const y = baseY + i * lineHeight;
    const w = ctx.measureText(ln).width + 36;
    const x = (W - w) / 2;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(ctx, x, y - 10, w, lineHeight - 6, 18);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(ln, W / 2, y);
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function composeVideo(
  opts: ComposeOptions,
): Promise<ComposeResult> {
  const W = opts.width ?? 1080;
  const H = opts.height ?? 1920;
  const fps = opts.fps ?? 30;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const { buffer, context: audioCtx } = await blobToAudioBuffer(opts.audio);
  const audioDurationSec = buffer.duration;

  let videoEl: HTMLVideoElement | null = null;
  let images: HTMLImageElement[] = [];
  let scenesScaled: Scene[] = [];

  if (opts.mode.kind === "slideshow") {
    if (opts.mode.images.length === 0) {
      throw new Error("No product images to render");
    }
    images = await Promise.all(
      opts.mode.images.map((i) => loadImage(i.dataUrl)),
    );
    const scenesRaw =
      opts.mode.scenes.length > 0
        ? opts.mode.scenes
        : [
            {
              id: "x",
              index: 0,
              voiceLine: "",
              description: "",
              acting: "",
              duration: Math.max(8, audioDurationSec),
            },
          ];
    const sum = scenesRaw.reduce((a, s) => a + s.duration, 0) || 1;
    const scaleFactor = audioDurationSec / sum;
    scenesScaled = scenesRaw.map((s) => ({
      ...s,
      duration: s.duration * scaleFactor,
    }));
  } else {
    videoEl = await loadVideo(opts.mode.source);
  }

  const stream = canvas.captureStream(fps);
  const dest = audioCtx.createMediaStreamDestination();
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(dest);
  src.connect(audioCtx.destination);
  for (const track of dest.stream.getAudioTracks()) {
    stream.addTrack(track);
  }

  const { mime } = pickMimeType();
  const recorder = new MediaRecorder(
    stream,
    mime ? { mimeType: mime, videoBitsPerSecond: 6_000_000 } : undefined,
  );
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const finished: Promise<Blob> = new Promise((resolve) => {
    recorder.onstop = () =>
      resolve(new Blob(chunks, { type: mime || "video/webm" }));
  });

  // Voiceover always drives the runtime; the fal video loops underneath.
  const totalSec = audioDurationSec;
  const totalMs = totalSec * 1000;

  if (videoEl) {
    videoEl.currentTime = 0;
    try {
      await videoEl.play();
    } catch {
      /* allow autoplay failures, draw will still work */
    }
  }

  const startTime = performance.now();
  let stopped = false;
  let rafId = 0;

  function drawSlideshowFrame(t: number) {
    let acc = 0;
    let activeIdx = 0;
    for (let i = 0; i < scenesScaled.length; i++) {
      if (t >= acc && t < acc + scenesScaled[i].duration) {
        activeIdx = i;
        break;
      }
      acc += scenesScaled[i].duration;
      activeIdx = i;
    }

    const sceneStart = scenesScaled
      .slice(0, activeIdx)
      .reduce((a, s) => a + s.duration, 0);
    const localT = Math.max(
      0,
      Math.min(scenesScaled[activeIdx].duration, t - sceneStart),
    );
    const progress = localT / Math.max(0.001, scenesScaled[activeIdx].duration);

    const img = images[activeIdx % images.length];
    const scale = 1.04 + progress * 0.08;
    const panX = (progress - 0.5) * 60;
    const panY = (progress - 0.5) * 30;

    ctx!.fillStyle = "#0b0b0d";
    ctx!.fillRect(0, 0, W, H);
    drawCoverImage(ctx!, img, W, H, scale, panX, panY);
    drawVignette(ctx!, W, H);

    const sceneCaption =
      scenesScaled[activeIdx].description?.slice(0, 90) ?? "";
    const showHook = t < Math.min(3.2, audioDurationSec);
    if (showHook && opts.hook) {
      drawCaption(ctx!, opts.hook, W, H, "top");
    } else if (sceneCaption) {
      drawCaption(ctx!, sceneCaption, W, H, "top");
    }
  }

  function drawVideoFrame(t: number) {
    if (!videoEl) return;
    ctx!.fillStyle = "#000";
    ctx!.fillRect(0, 0, W, H);
    drawCoverImage(ctx!, videoEl, W, H, 1, 0, 0);
    drawVignette(ctx!, W, H);
    if (t < Math.min(3.2, audioDurationSec) && opts.hook) {
      drawCaption(ctx!, opts.hook, W, H, "top");
    }
  }

  function frame(now: number) {
    const elapsed = now - startTime;
    const t = elapsed / 1000;

    if (elapsed >= totalMs) {
      drawFinal(t);
      stopped = true;
      try {
        recorder.stop();
      } catch {
        /* noop */
      }
      try {
        src.stop();
      } catch {
        /* noop */
      }
      videoEl?.pause();
      opts.onProgress?.(1);
      return;
    }

    drawFinal(t);
    opts.onProgress?.(Math.min(1, elapsed / totalMs));
    rafId = requestAnimationFrame(frame);
  }

  function drawFinal(t: number) {
    if (opts.mode.kind === "slideshow") drawSlideshowFrame(t);
    else drawVideoFrame(t);

    const showCTA = t > audioDurationSec - 3.2 || t >= totalMs / 1000;
    if (showCTA && opts.cta) {
      drawCaption(ctx!, opts.cta, W, H, "bottom");
    }

    ctx!.font = `600 28px -apple-system, "SF Pro Display", Inter, system-ui, sans-serif`;
    ctx!.fillStyle = "rgba(255,255,255,0.85)";
    ctx!.textAlign = "left";
    ctx!.textBaseline = "top";
    ctx!.fillText("Lumen", 36, 36);
  }

  recorder.start(250);
  src.start();
  rafId = requestAnimationFrame(frame);

  const blob = await finished;
  if (!stopped) cancelAnimationFrame(rafId);
  try {
    audioCtx.close();
  } catch {
    /* noop */
  }
  if (videoEl) {
    URL.revokeObjectURL(videoEl.src);
  }

  return { videoBlob: blob, durationMs: totalMs, mimeType: mime || "video/webm" };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

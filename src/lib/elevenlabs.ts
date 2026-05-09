// Import the lower-level (auto-generated) client to avoid the wrapper, which
// pulls in Node-only modules (child_process, crypto, ws) for play()/stream()/
// webhooks. We only need TTS in the browser.
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js/Client";

export type ElevenVoice = {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
};

export const DEFAULT_VOICES: ElevenVoice[] = [
  { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel — warm, conversational" },
  { voice_id: "AZnzlk1XvdvUeBnXmlld", name: "Domi — energetic young woman" },
  { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella — friendly, soft" },
  { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni — chill, modern man" },
  { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli — youthful, upbeat" },
  { voice_id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh — deep, confident" },
  { voice_id: "VR6AewLTigWG4xSOukaG", name: "Arnold — assertive narrator" },
  { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam — natural, neutral" },
  { voice_id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam — friendly American" },
];

function makeClient(apiKey: string) {
  return new ElevenLabsClient({ apiKey });
}

export async function fetchUserVoices(apiKey: string): Promise<ElevenVoice[]> {
  if (!apiKey) return DEFAULT_VOICES;
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });
    if (!res.ok) return DEFAULT_VOICES;
    const data = await res.json();
    const voices: ElevenVoice[] = (data.voices ?? []).map(
      (v: {
        voice_id: string;
        name: string;
        labels?: Record<string, string>;
      }) => ({
        voice_id: v.voice_id,
        name: v.name,
        labels: v.labels,
      }),
    );
    return voices.length ? voices : DEFAULT_VOICES;
  } catch {
    return DEFAULT_VOICES;
  }
}

async function streamToBlob(
  stream: ReadableStream<Uint8Array>,
  mime: string,
): Promise<Blob> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return new Blob(chunks as BlobPart[], { type: mime });
}

export async function synthesizeVoice(opts: {
  apiKey: string;
  voiceId: string;
  text: string;
}): Promise<Blob> {
  if (!opts.apiKey) throw new Error("Missing ElevenLabs API key");
  if (!opts.text.trim()) throw new Error("No script text to synthesize");

  const client = makeClient(opts.apiKey);

  try {
    const audioStream = await client.textToSpeech.convert(opts.voiceId, {
      text: opts.text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.45,
        similarityBoost: 0.8,
        style: 0.35,
        useSpeakerBoost: true,
      },
    });
    return await streamToBlob(audioStream, "audio/mpeg");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`ElevenLabs synthesis failed: ${msg}`);
  }
}

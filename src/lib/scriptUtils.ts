import type { Scene } from "../types";

export type RawScene = {
  voiceLine?: string;
  description?: string;
  acting?: string;
  bRoll?: string;
  duration?: number;
};

export function normalizeScenes(
  raw: RawScene[],
  targetDuration: number,
): Scene[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const scenes = raw.map((s, i) => ({
    id: crypto.randomUUID(),
    index: i,
    voiceLine: s.voiceLine ?? "",
    description: s.description ?? "",
    acting: s.acting ?? "",
    bRoll: s.bRoll ?? "",
    duration: Math.max(
      1,
      Math.round(s.duration ?? targetDuration / Math.max(1, raw.length)),
    ),
  }));
  const sum = scenes.reduce((a, s) => a + s.duration, 0);
  if (sum !== targetDuration && scenes.length) {
    const diff = targetDuration - sum;
    scenes[scenes.length - 1].duration = Math.max(
      1,
      scenes[scenes.length - 1].duration + diff,
    );
  }
  return scenes;
}

export function fullScriptFromScenes(scenes: Scene[]): string {
  return scenes
    .map((s) => s.voiceLine.trim())
    .filter(Boolean)
    .join(" ");
}

export function stripJson(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return t;
}

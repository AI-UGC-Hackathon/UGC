import { PERSONAS, type PersonaId } from "./personas";

const KEYS = {
  gemini: "ugc.geminiKey",
  eleven: "ugc.elevenKey",
  exa: "ugc.exaKey",
  openai: "ugc.openaiKey",
  fal: "ugc.falKey",
  voice: "ugc.elevenVoiceId",
  persona: "ugc.personaId",
  seeded: "ugc.seededV4",
} as const;

export type ApiKeys = {
  geminiKey: string;
  elevenKey: string;
  exaKey: string;
  openaiKey: string;
  falKey: string;
  voiceId: string;
};

// Read from Vite env so secrets stay out of source. To pre-seed, copy
// .env.example to .env.local and fill in values; they will be saved to
// localStorage on first load only and never committed.
function envSeed() {
  const env = (import.meta as unknown as { env: Record<string, string> }).env;
  return {
    geminiKey: env?.VITE_GEMINI_KEY ?? "",
    elevenKey: env?.VITE_ELEVENLABS_KEY ?? "",
    exaKey: env?.VITE_EXA_KEY ?? "",
    openaiKey: env?.VITE_OPENAI_KEY ?? "",
    falKey: env?.VITE_FAL_KEY ?? "",
  };
}

export function ensureSeeded() {
  if (localStorage.getItem(KEYS.seeded)) return;
  const seed = envSeed();
  if (seed.geminiKey && !localStorage.getItem(KEYS.gemini))
    localStorage.setItem(KEYS.gemini, seed.geminiKey);
  if (seed.elevenKey && !localStorage.getItem(KEYS.eleven))
    localStorage.setItem(KEYS.eleven, seed.elevenKey);
  if (seed.exaKey && !localStorage.getItem(KEYS.exa))
    localStorage.setItem(KEYS.exa, seed.exaKey);
  if (seed.openaiKey && !localStorage.getItem(KEYS.openai))
    localStorage.setItem(KEYS.openai, seed.openaiKey);
  if (seed.falKey && !localStorage.getItem(KEYS.fal))
    localStorage.setItem(KEYS.fal, seed.falKey);
  localStorage.setItem(KEYS.seeded, "1");
}

export function loadKeys(): ApiKeys {
  return {
    geminiKey: localStorage.getItem(KEYS.gemini) ?? "",
    elevenKey: localStorage.getItem(KEYS.eleven) ?? "",
    exaKey: localStorage.getItem(KEYS.exa) ?? "",
    openaiKey: localStorage.getItem(KEYS.openai) ?? "",
    falKey: localStorage.getItem(KEYS.fal) ?? "",
    voiceId:
      localStorage.getItem(KEYS.voice) ?? "21m00Tcm4TlvDq8ikWAM", // Rachel
  };
}

export function saveKeys(keys: Partial<ApiKeys>) {
  if (keys.geminiKey !== undefined)
    localStorage.setItem(KEYS.gemini, keys.geminiKey);
  if (keys.elevenKey !== undefined)
    localStorage.setItem(KEYS.eleven, keys.elevenKey);
  if (keys.exaKey !== undefined) localStorage.setItem(KEYS.exa, keys.exaKey);
  if (keys.openaiKey !== undefined)
    localStorage.setItem(KEYS.openai, keys.openaiKey);
  if (keys.falKey !== undefined)
    localStorage.setItem(KEYS.fal, keys.falKey);
  if (keys.voiceId !== undefined) localStorage.setItem(KEYS.voice, keys.voiceId);
}

export function clearKeys() {
  localStorage.removeItem(KEYS.gemini);
  localStorage.removeItem(KEYS.eleven);
  localStorage.removeItem(KEYS.exa);
  localStorage.removeItem(KEYS.openai);
  localStorage.removeItem(KEYS.fal);
  localStorage.removeItem(KEYS.voice);
  localStorage.removeItem(KEYS.persona);
  localStorage.removeItem(KEYS.seeded);
}

export function loadPersonaId(): PersonaId {
  const stored = localStorage.getItem(KEYS.persona) as PersonaId | null;
  if (stored && PERSONAS.some((p) => p.id === stored)) return stored;
  return "lifestyle";
}

export function savePersonaId(id: PersonaId) {
  localStorage.setItem(KEYS.persona, id);
}

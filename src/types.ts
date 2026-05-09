import type { PersonaId } from "./lib/personas";

export type Platform = "TikTok" | "Instagram Reels" | "YouTube Shorts";
export type Tone =
  | "Funny"
  | "Luxury"
  | "Educational"
  | "Testimonial"
  | "Energetic"
  | "Calm";
export type Duration = 15 | 30 | 60;

export type ProductImage = {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  label?: string;
};

export type CampaignBrief = {
  productDescription: string;
  audience: string;
  platform: Platform;
  tone: Tone;
  duration: Duration;
  angle: string;
  notes: string;
  personaId: PersonaId;
  researchNotes: string;
};

export type Scene = {
  id: string;
  index: number;
  voiceLine: string;
  description: string;
  acting: string;
  bRoll?: string;
  duration: number;
};

export type Script = {
  hooks: string[];
  selectedHookIndex: number;
  scenes: Scene[];
  cta: string;
};

export type Stage =
  | "landing"
  | "review"
  | "generating"
  | "results";

export type GenerationStatus = {
  step: string;
  progress: number;
  message: string;
};

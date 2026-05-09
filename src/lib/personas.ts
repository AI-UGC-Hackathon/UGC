export type PersonaId =
  | "lifestyle"
  | "fitness"
  | "mom"
  | "tech"
  | "luxury"
  | "skincare"
  | "deep";

export type Persona = {
  id: PersonaId;
  name: string;
  blurb: string;
  voiceId: string;
  voiceName: string;
  emoji: string;
  styleNotes: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "lifestyle",
    name: "Maya — lifestyle creator",
    blurb: "Late-20s, breezy, aspirational, TikTok-native delivery.",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella
    voiceName: "Bella",
    emoji: "🌿",
    styleNotes:
      "Voice of a 26-year-old female lifestyle creator. Conversational, warm, confident. Uses short relatable openers ('okay so this is wild'). Avoids cringe slang, sounds like a real person filming on their phone.",
  },
  {
    id: "fitness",
    name: "Jordan — fitness coach",
    blurb: "High energy, motivational, gym-going, results-focused.",
    voiceId: "TxGEqnHWrfWFTfGW9XjX", // Josh
    voiceName: "Josh",
    emoji: "💪",
    styleNotes:
      "Voice of a 30-something male fitness coach. Energetic, direct, results-driven. Uses crisp imperatives ('here's what you do'). No fluff. Confident bro-energy without being cringe.",
  },
  {
    id: "mom",
    name: "Ashley — mom influencer",
    blurb: "Warm, real, problem/solution honesty for busy parents.",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
    voiceName: "Rachel",
    emoji: "🍼",
    styleNotes:
      "Voice of a 34-year-old mom. Warm, candid, slightly tired but optimistic. Speaks from real life: chaos of mornings, school runs, packed lunches. Uses 'honestly' and 'okay listen' naturally.",
  },
  {
    id: "tech",
    name: "Ryan — tech reviewer",
    blurb: "Calm, analytical, MKBHD-adjacent, demo-driven.",
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam
    voiceName: "Adam",
    emoji: "🎧",
    styleNotes:
      "Voice of a 28-year-old male tech reviewer. Measured, articulate, specific. Names features and trade-offs. Avoids hype words. Treats the camera like a friend asking for honest impressions.",
  },
  {
    id: "luxury",
    name: "Sienna — luxury spokesperson",
    blurb: "Refined, slow cadence, high-end editorial tone.",
    voiceId: "AZnzlk1XvdvUeBnXmlld", // Domi
    voiceName: "Domi",
    emoji: "🥂",
    styleNotes:
      "Voice of a 30-something premium brand voice. Slower cadence, elevated diction, sensorial language. Short sentences. Confident, never loud.",
  },
  {
    id: "skincare",
    name: "Hana — beauty / skincare",
    blurb: "Soft, intimate, dermatology-curious, ingredient-led.",
    voiceId: "MF3mGyEYCl7XYWbV9V6O", // Elli
    voiceName: "Elli",
    emoji: "💆‍♀️",
    styleNotes:
      "Voice of a beauty creator who actually knows ingredients. Soft, almost ASMR delivery. Mentions textures, finishes, and how skin feels. Calm and genuine.",
  },
  {
    id: "deep",
    name: "Marcus — narrator",
    blurb: "Deep, grounded, cinematic VO for premium product spots.",
    voiceId: "VR6AewLTigWG4xSOukaG", // Arnold
    voiceName: "Arnold",
    emoji: "🎙️",
    styleNotes:
      "Cinematic male narrator voice. Deep, deliberate, confident. Treats the script like a short film. Sentences are tight and weighty.",
  },
];

export function getPersona(id: PersonaId): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

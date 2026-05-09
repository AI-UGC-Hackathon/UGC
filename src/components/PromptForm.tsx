import type { CampaignBrief, Duration, Platform, Tone } from "../types";
import { PersonaPicker } from "./PersonaPicker";
import { ResearchPanel } from "./ResearchPanel";
import { Sparkles } from "./icons";

type Props = {
  brief: CampaignBrief;
  onChange: (b: CampaignBrief) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  exaKey: string;
  onOpenSettings: () => void;
};

const PLATFORMS: Platform[] = ["TikTok", "Instagram Reels", "YouTube Shorts"];
const TONES: Tone[] = [
  "Funny",
  "Luxury",
  "Educational",
  "Testimonial",
  "Energetic",
  "Calm",
];
const DURATIONS: Duration[] = [15, 30, 60];

export function PromptForm({
  brief,
  onChange,
  onGenerate,
  canGenerate,
  isGenerating,
  exaKey,
  onOpenSettings,
}: Props) {
  const set = <K extends keyof CampaignBrief>(k: K, v: CampaignBrief[K]) =>
    onChange({ ...brief, [k]: v });

  return (
    <div className="card p-7">
      <h3 className="text-[20px] font-semibold tracking-tight">
        Campaign brief
      </h3>
      <p className="text-[14px] text-ink-500 mt-1 mb-5">
        Tell Lumen what you're selling, who it's for, and how it should sound.
      </p>

      <div className="space-y-4">
        <div>
          <label className="label">Product description</label>
          <textarea
            className="input mt-1.5 min-h-[80px] resize-none"
            placeholder="e.g. A 16oz portable USB-C blender with a self-cleaning blade — makes a smoothie in 45 seconds."
            value={brief.productDescription}
            onChange={(e) => set("productDescription", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Target audience</label>
          <input
            className="input mt-1.5"
            placeholder="e.g. Busy moms aged 28–42 who want healthy breakfasts"
            value={brief.audience}
            onChange={(e) => set("audience", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Marketing angle</label>
          <textarea
            className="input mt-1.5 min-h-[80px] resize-none"
            placeholder="The hook, the problem you solve, what to emphasize."
            value={brief.angle}
            onChange={(e) => set("angle", e.target.value)}
          />
        </div>

        <ResearchPanel
          brief={brief}
          exaKey={exaKey}
          onApplyNotes={(notes) => set("researchNotes", notes)}
          onOpenSettings={onOpenSettings}
        />

        <PersonaPicker
          value={brief.personaId}
          onChange={(id) => set("personaId", id)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Platform"
            value={brief.platform}
            onChange={(v) => set("platform", v as Platform)}
            options={PLATFORMS}
          />
          <Select
            label="Tone"
            value={brief.tone}
            onChange={(v) => set("tone", v as Tone)}
            options={TONES}
          />
          <Select
            label="Duration"
            value={String(brief.duration)}
            onChange={(v) => set("duration", Number(v) as Duration)}
            options={DURATIONS.map(String)}
            suffix="s"
          />
        </div>

        <div>
          <label className="label">Special instructions (optional)</label>
          <textarea
            className="input mt-1.5 min-h-[64px] resize-none"
            placeholder="Anything required, banned phrases, must-mention features…"
            value={brief.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-[12px] text-ink-500">
          Powered by Gemini · Voice by ElevenLabs
        </p>
        <button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="btn-accent"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "Generating script…" : "Generate script"}
        </button>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  suffix,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  suffix?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative mt-1.5">
        <select
          className={`input appearance-none pr-10 ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
              {suffix ?? ""}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {hint && (
        <p className="text-[11px] text-ink-500 mt-1">{hint}</p>
      )}
    </div>
  );
}

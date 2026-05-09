import { PERSONAS, type PersonaId } from "../lib/personas";
import { Check } from "./icons";

type Props = {
  value: PersonaId;
  onChange: (id: PersonaId) => void;
};

export function PersonaPicker({ value, onChange }: Props) {
  return (
    <div>
      <label className="label">AI creator</label>
      <p className="text-[12px] text-ink-500 mt-1">
        Sets the writing style for Gemini and the voice for ElevenLabs.
      </p>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PERSONAS.map((p) => {
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`relative text-left rounded-2xl border p-3 transition ${
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-ink-100 bg-white hover:border-ink-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-[20px] leading-none mt-0.5">
                  {p.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ink-900 truncate">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-ink-500 leading-snug line-clamp-2 mt-0.5">
                    {p.blurb}
                  </div>
                  <div className="text-[10px] text-ink-300 mt-1.5 uppercase tracking-wide">
                    Voice · {p.voiceName}
                  </div>
                </div>
                {selected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent text-white grid place-items-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

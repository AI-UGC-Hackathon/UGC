import { Mic, Film, Sparkles } from "./icons";

export type GenStep = "voice" | "video";

type Props = {
  step: GenStep;
  progress: number;
  message: string;
  error?: string | null;
  onCancel: () => void;
};

const TITLES: Record<GenStep, string> = {
  voice: "Generating influencer voice",
  video: "Generating UGC video with Veo 3 (fal.ai)",
};

export function GenerationView({
  step,
  progress,
  message,
  error,
  onCancel,
}: Props) {
  const Icon = step === "voice" ? Mic : Film;
  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <div className="card p-10 text-center animate-fadeUp">
        <div className="w-16 h-16 rounded-full bg-ink-900 text-white grid place-items-center mx-auto mb-6 relative">
          <Icon className="w-7 h-7" />
          <span className="absolute -inset-1 rounded-full border-2 border-ink-100 animate-pulse" />
        </div>
        <h2 className="text-[26px] font-semibold tracking-tight">
          {TITLES[step]}
        </h2>
        <p className="text-[15px] text-ink-500 mt-2">
          {message || "Working on it…"}
        </p>

        <div className="mt-7">
          <div className="h-1.5 rounded-full bg-ink-900/5 overflow-hidden">
            <div
              className="h-full bg-ink-900 transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="text-[12px] text-ink-500 mt-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            {Math.round(progress * 100)}%
          </div>
        </div>

        {step === "video" && !error && (
          <p className="text-[12px] text-ink-300 mt-4">
            Veo renders on fal.ai usually take 1–3 minutes. Leave this tab
            open.
          </p>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-700 text-left">
            {error}
          </div>
        )}

        <div className="mt-8">
          <button onClick={onCancel} className="btn-ghost">
            {error ? "Back" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

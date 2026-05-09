import { ArrowRight, Play } from "./icons";

type Props = {
  onPrimary: () => void;
};

export function Hero({ onPrimary }: Props) {
  return (
    <section className="px-6 pt-16 sm:pt-24 pb-10 text-center">
      <div className="mx-auto max-w-3xl animate-fadeUp">
        <span className="chip mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          New · powered by Gemini + ElevenLabs
        </span>
        <h1 className="text-balance text-[44px] sm:text-[64px] leading-[1.05] font-semibold tracking-tight">
          Cinematic UGC ads that look like they cost{" "}
          <span className="bg-gradient-to-br from-ink-900 to-ink-500 bg-clip-text text-transparent">
            thousands
          </span>
          .
        </h1>
        <p className="mt-5 text-[17px] sm:text-[19px] leading-[1.55] text-ink-500 max-w-2xl mx-auto text-balance">
          Drop a few product photos, write a brief, and get a polished AI
          influencer video — script, voice and all — in minutes. No creators, no
          shipping, no waiting.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={onPrimary} className="btn-primary">
            Create your first ad
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="https://www.youtube.com/results?search_query=ugc+ad+examples"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <Play className="w-3.5 h-3.5" />
            Watch examples
          </a>
        </div>
      </div>
    </section>
  );
}

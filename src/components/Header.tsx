import { Settings } from "./icons";

type Props = {
  onOpenSettings: () => void;
  onLogo: () => void;
  hasKeys: boolean;
};

export function Header({ onOpenSettings, onLogo, hasKeys }: Props) {
  return (
    <header className="sticky top-0 z-30 glass border-b border-black/[0.06]">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <button
          onClick={onLogo}
          className="flex items-center gap-2 group"
          aria-label="Lumen home"
        >
          <span className="inline-block w-7 h-7 rounded-lg bg-ink-900 grid place-items-center text-white text-[13px] font-bold">
            L
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Lumen</span>
          <span className="text-[13px] text-ink-300 hidden sm:inline">
            AI UGC Studio
          </span>
        </button>
        <div className="flex items-center gap-2">
          {!hasKeys && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-ink-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              API keys required
            </span>
          )}
          <button
            onClick={onOpenSettings}
            className="btn-ghost !px-4 !py-2 text-[13px]"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}

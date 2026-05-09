import { useState } from "react";
import type { CampaignBrief } from "../types";
import {
  formatResearchForPrompt,
  researchProduct,
  type ExaInsight,
  type ExaResearch,
} from "../lib/exa";
import { Sparkles, Refresh, Check, X } from "./icons";

type Props = {
  brief: CampaignBrief;
  exaKey: string;
  onApplyNotes: (notes: string) => void;
  onOpenSettings: () => void;
};

const CATEGORY_LABEL: Record<ExaInsight["category"], string> = {
  trend: "Trend",
  audience_pain: "Audience pain",
  competitor_angle: "Competitor",
  fact: "Fact",
};

const CATEGORY_COLOR: Record<ExaInsight["category"], string> = {
  trend: "bg-violet-50 text-violet-700 border-violet-100",
  audience_pain: "bg-rose-50 text-rose-700 border-rose-100",
  competitor_angle: "bg-amber-50 text-amber-700 border-amber-100",
  fact: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export function ResearchPanel({
  brief,
  exaKey,
  onApplyNotes,
  onOpenSettings,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState<ExaResearch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const hasContext = Boolean(
    brief.productDescription || brief.angle || brief.audience,
  );

  async function runResearch() {
    if (!exaKey) {
      onOpenSettings();
      return;
    }
    setLoading(true);
    setError(null);
    setResearch(null);
    setPicked(new Set());
    try {
      const r = await researchProduct({
        apiKey: exaKey,
        productDescription: brief.productDescription,
        audience: brief.audience,
        platform: brief.platform,
        angle: brief.angle,
      });
      setResearch(r);
      setPicked(new Set(r.insights.map((_, i) => i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Exa research failed");
    } finally {
      setLoading(false);
    }
  }

  function applySelected() {
    if (!research) return;
    const filtered = research.insights.filter((_, i) => picked.has(i));
    if (filtered.length === 0) {
      onApplyNotes("");
      return;
    }
    const notes = formatResearchForPrompt({ ...research, insights: filtered });
    onApplyNotes(notes);
  }

  const isApplied = Boolean(brief.researchNotes);

  return (
    <div className="rounded-2xl border border-ink-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 grid place-items-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-ink-900 flex items-center gap-2">
              Research with Exa
              <span className="text-[10px] font-medium text-ink-300 uppercase tracking-wide">
                Optional
              </span>
              {isApplied && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                  <Check className="w-3 h-3" />
                  Applied
                </span>
              )}
            </div>
            <div className="text-[12px] text-ink-500 truncate">
              Pull live trends, audience pains and competitor angles into the
              brief.
            </div>
          </div>
        </div>
        <span
          className={`text-ink-300 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-ink-100 p-4 space-y-3 animate-fadeUp">
          {!hasContext && !research && (
            <p className="text-[12px] text-ink-500">
              Add a product description or marketing angle above to get sharper
              research.
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runResearch}
              disabled={loading}
              className="btn-ghost !px-3 !py-2 text-[13px]"
            >
              {loading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Searching the web…
                </>
              ) : research ? (
                <>
                  <Refresh className="w-3.5 h-3.5" />
                  Run again
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Run research
                </>
              )}
            </button>
            {isApplied && (
              <button
                type="button"
                onClick={() => onApplyNotes("")}
                className="btn-quiet !px-3 !py-1.5 text-[12px]"
              >
                <X className="w-3 h-3" />
                Clear notes
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-[12px] text-red-700">
              {error}
            </div>
          )}

          {research && (
            <div className="space-y-2">
              <div className="text-[11px] text-ink-500 uppercase tracking-wide">
                {research.insights.length} insights · query "{research.query}"
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {research.insights.map((ins, i) => {
                  const sel = picked.has(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const next = new Set(picked);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        setPicked(next);
                      }}
                      className={`w-full text-left rounded-xl border p-3 transition ${
                        sel
                          ? "border-accent bg-accent-soft"
                          : "border-ink-100 hover:border-ink-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 w-4 h-4 rounded grid place-items-center flex-shrink-0 ${
                            sel
                              ? "bg-accent text-white"
                              : "border border-ink-100 bg-white"
                          }`}
                        >
                          {sel && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span
                            className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                              CATEGORY_COLOR[ins.category]
                            } mb-1`}
                          >
                            {CATEGORY_LABEL[ins.category]}
                          </span>
                          <p className="text-[13px] leading-snug text-ink-900">
                            {ins.insight}
                          </p>
                          {ins.source && (
                            <a
                              href={ins.source}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-ink-300 hover:text-accent truncate block mt-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {new URL(ins.source).hostname}
                            </a>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[12px] text-ink-500">
                  {picked.size} selected
                </span>
                <button
                  type="button"
                  onClick={applySelected}
                  className="btn-primary !px-4 !py-2 text-[13px]"
                >
                  Apply to brief
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

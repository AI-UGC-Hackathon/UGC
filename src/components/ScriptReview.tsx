import { useMemo, useState } from "react";
import type { CampaignBrief, ProductImage, Script } from "../types";
import { fullScriptFromScenes } from "../lib/scriptUtils";
import { regenerateSection } from "../lib/gemini";
import { getPersona } from "../lib/personas";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mic,
  Pencil,
  Refresh,
  Sparkles,
} from "./icons";

type Props = {
  apiKey: string;
  brief: CampaignBrief;
  images: ProductImage[];
  script: Script;
  onChange: (s: Script) => void;
  onBack: () => void;
  onApprove: () => void;
};

export function ScriptReview({
  apiKey,
  brief,
  images,
  script,
  onChange,
  onBack,
  onApprove,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalDuration = script.scenes.reduce((a, s) => a + s.duration, 0);
  const fullScript = useMemo(() => fullScriptFromScenes(script.scenes), [
    script.scenes,
  ]);
  const persona = getPersona(brief.personaId);

  async function regen(
    section: "hooks" | "scenes" | "cta" | "scene",
    sceneIndex?: number,
  ) {
    if (!apiKey) {
      setError("Add your Gemini API key in Settings to regenerate.");
      return;
    }
    const busyId = section === "scene" ? `scene-${sceneIndex}` : section;
    setBusy(busyId);
    setError(null);
    try {
      const patch = await regenerateSection({
        apiKey,
        section,
        brief,
        current: script,
        images,
        sceneIndex,
      });
      onChange({ ...script, ...patch });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16">
      <div className="flex items-center justify-between mb-6 gap-3">
        <button onClick={onBack} className="btn-quiet">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-[13px] text-ink-500 hidden sm:flex items-center gap-3">
          <span className="chip">{persona.emoji} {persona.name.split(" — ")[0]}</span>
          <span>~{Math.round(totalDuration)}s · {brief.platform} · {brief.tone}</span>
        </div>
        <button onClick={onApprove} className="btn-accent">
          Approve & generate video
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: hooks + scenes */}
        <div className="lg:col-span-7 space-y-6">
          <Section
            title="Hooks"
            subtitle="Pick the strongest opener — it becomes your top caption."
            onRegenerate={() => regen("hooks")}
            busy={busy === "hooks"}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {script.hooks.map((h, i) => (
                <button
                  key={i}
                  onClick={() => onChange({ ...script, selectedHookIndex: i })}
                  className={`text-left rounded-2xl border p-4 transition ${
                    script.selectedHookIndex === i
                      ? "border-accent bg-accent-soft"
                      : "border-ink-100 hover:border-ink-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-full grid place-items-center text-[11px] font-semibold flex-shrink-0 ${
                        script.selectedHookIndex === i
                          ? "bg-accent text-white"
                          : "bg-ink-900/5 text-ink-500"
                      }`}
                    >
                      {script.selectedHookIndex === i ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <p className="text-[14px] leading-relaxed text-ink-900">
                      {h}
                    </p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  const text = prompt("Write a custom hook:");
                  if (text)
                    onChange({
                      ...script,
                      hooks: [...script.hooks, text],
                      selectedHookIndex: script.hooks.length,
                    });
                }}
                className="rounded-2xl border border-dashed border-ink-100 p-4 text-[13px] text-ink-500 hover:border-ink-300 hover:text-ink-900 transition"
              >
                + Add custom hook
              </button>
            </div>
          </Section>

          <Section
            title="Segments"
            subtitle="Each segment pairs the spoken line, the action on screen, and B-roll. The voice lines stitched together become the full VO."
            onRegenerate={() => regen("scenes")}
            busy={busy === "scenes"}
          >
            <div className="space-y-3">
              {script.scenes.map((s, idx) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-ink-100 p-4 bg-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-ink-900 text-white grid place-items-center text-[11px] font-semibold">
                        {idx + 1}
                      </span>
                      <span className="text-[13px] font-medium">
                        Segment {idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => regen("scene", idx)}
                        disabled={busy === `scene-${idx}`}
                        className="btn-quiet !px-2 !py-1 text-[12px]"
                      >
                        <Refresh className="w-3 h-3" />
                        {busy === `scene-${idx}` ? "…" : "Regenerate"}
                      </button>
                      <input
                        type="number"
                        min={1}
                        className="w-16 rounded-lg border border-ink-100 px-2 py-1 text-[12px] text-right"
                        value={s.duration}
                        onChange={(e) => {
                          const d = Math.max(1, Number(e.target.value) || 1);
                          const scenes = [...script.scenes];
                          scenes[idx] = { ...s, duration: d };
                          onChange({ ...script, scenes });
                        }}
                      />
                      <span className="text-[12px] text-ink-500">sec</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-accent-soft/60 border border-accent/15 p-3 mb-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent uppercase tracking-wide mb-1.5">
                      <Mic className="w-3 h-3" />
                      Voice line
                    </div>
                    <textarea
                      className="w-full resize-none bg-transparent outline-none text-[14px] leading-relaxed text-ink-900 placeholder:text-ink-300"
                      rows={Math.max(2, Math.ceil(s.voiceLine.length / 70))}
                      placeholder="What the creator says in this segment…"
                      value={s.voiceLine}
                      onChange={(e) => {
                        const scenes = [...script.scenes];
                        scenes[idx] = { ...s, voiceLine: e.target.value };
                        onChange({ ...script, scenes });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <EditableField
                      label="On-screen action"
                      value={s.description}
                      onChange={(v) => {
                        const scenes = [...script.scenes];
                        scenes[idx] = { ...s, description: v };
                        onChange({ ...script, scenes });
                      }}
                    />
                    <EditableField
                      label="Acting cue"
                      value={s.acting}
                      onChange={(v) => {
                        const scenes = [...script.scenes];
                        scenes[idx] = { ...s, acting: v };
                        onChange({ ...script, scenes });
                      }}
                    />
                    {s.bRoll !== undefined && (
                      <EditableField
                        label="B-roll"
                        value={s.bRoll ?? ""}
                        onChange={(v) => {
                          const scenes = [...script.scenes];
                          scenes[idx] = { ...s, bRoll: v };
                          onChange({ ...script, scenes });
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Call to action"
            onRegenerate={() => regen("cta")}
            busy={busy === "cta"}
          >
            <input
              className="input"
              value={script.cta}
              onChange={(e) => onChange({ ...script, cta: e.target.value })}
            />
          </Section>

          <Section title="Stitched voiceover preview">
            <p className="text-[14px] leading-relaxed text-ink-700">
              {fullScript || "Your stitched script will appear here."}
            </p>
            <div className="text-[12px] text-ink-500 mt-3">
              {fullScript.split(/\s+/).filter(Boolean).length} words ·{" "}
              {script.scenes.length} segments · {Math.round(totalDuration)}s
            </div>
          </Section>
        </div>

        {/* Right: storyboard */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="card p-5">
              <div className="text-[13px] font-medium text-ink-500 mb-3">
                Storyboard preview
              </div>
              <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-ink-900 relative">
                {images[0] ? (
                  <img
                    src={images[0].dataUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-white/50 text-[13px]">
                    No image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
                <div className="absolute top-4 left-4 right-4">
                  <div className="inline-block bg-black/55 text-white text-[13px] font-semibold rounded-xl px-3 py-2 leading-snug">
                    {script.hooks[script.selectedHookIndex] ?? "—"}
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-block bg-black/55 text-white text-[13px] font-semibold rounded-xl px-3 py-2">
                    {script.cta || "Tap to learn more"}
                  </div>
                </div>
                <div className="absolute top-3 right-3 text-white/80 text-[11px] font-medium">
                  9:16 · 1080×1920
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="text-[13px] font-medium text-ink-500 mb-1">
                AI creator
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[28px] leading-none">{persona.emoji}</div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold truncate">
                    {persona.name}
                  </div>
                  <div className="text-[12px] text-ink-500 line-clamp-2">
                    {persona.blurb}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="text-[13px] font-medium text-ink-500 mb-3">
                Reference photos
              </div>
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 8).map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square rounded-xl overflow-hidden bg-ink-900/5"
                  >
                    <img
                      src={img.dataUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  onRegenerate,
  busy,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onRegenerate?: () => void;
  busy?: boolean;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[18px] font-semibold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-[13px] text-ink-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={busy}
            className="btn-ghost !px-3 !py-2 text-[13px]"
          >
            {busy ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Regenerating…
              </>
            ) : (
              <>
                <Refresh className="w-3.5 h-3.5" />
                Regenerate
              </>
            )}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div>
        <div className="label mb-1">{label}</div>
        <textarea
          autoFocus
          className="input min-h-[64px] resize-none text-[13px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
        />
      </div>
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-left group"
    >
      <div className="label mb-0.5">{label}</div>
      <div className="text-[13px] leading-relaxed text-ink-700 flex items-start gap-2">
        <span className="flex-1">{value || "—"}</span>
        <Pencil className="w-3 h-3 mt-1 text-ink-300 opacity-0 group-hover:opacity-100 transition" />
      </div>
    </button>
  );
}

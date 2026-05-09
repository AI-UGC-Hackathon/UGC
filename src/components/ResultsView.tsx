import { useEffect, useMemo, useRef, useState } from "react";
import type { Script } from "../types";
import { downloadBlob } from "../lib/videoComposer";
import { fullScriptFromScenes } from "../lib/scriptUtils";
import { ArrowLeft, Download, Refresh, Sparkles } from "./icons";

type Props = {
  videoBlob: Blob;
  audioBlob: Blob;
  script: Script;
  onRestart: () => void;
  onNewVariation: () => void;
};

function buildSrt(script: Script, audioDuration: number): string {
  const sentences = fullScriptFromScenes(script.scenes)
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  if (sentences.length === 0) return "";
  const per = audioDuration / sentences.length;
  const fmt = (s: number) => {
    const ms = Math.round((s % 1) * 1000)
      .toString()
      .padStart(3, "0");
    const total = Math.floor(s);
    const hh = String(Math.floor(total / 3600)).padStart(2, "0");
    const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss},${ms}`;
  };
  return sentences
    .map((s, i) => {
      const start = i * per;
      const end = Math.min(audioDuration, (i + 1) * per);
      return `${i + 1}\n${fmt(start)} --> ${fmt(end)}\n${s.trim()}\n`;
    })
    .join("\n");
}

export function ResultsView({
  videoBlob,
  audioBlob,
  script,
  onRestart,
  onNewVariation,
}: Props) {
  const videoUrl = useMemo(() => URL.createObjectURL(videoBlob), [videoBlob]);
  const audioUrl = useMemo(() => URL.createObjectURL(audioBlob), [audioBlob]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(videoUrl);
      URL.revokeObjectURL(audioUrl);
    };
  }, [videoUrl, audioUrl]);

  const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onRestart} className="btn-quiet">
          <ArrowLeft className="w-4 h-4" />
          Start a new project
        </button>
        <button onClick={onNewVariation} className="btn-ghost">
          <Refresh className="w-4 h-4" />
          Generate another variation
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div className="card p-5">
            <div className="rounded-2xl overflow-hidden bg-ink-900 aspect-[9/16] max-h-[80vh] mx-auto">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                playsInline
                className="w-full h-full object-contain bg-black"
                onLoadedMetadata={(e) =>
                  setDuration(e.currentTarget.duration || 0)
                }
              />
            </div>
            <div className="mt-4 text-center text-[13px] text-ink-500">
              {duration ? `${duration.toFixed(1)}s · ` : ""}9:16 · 1080×1920
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5 space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="chip">
                <Sparkles className="w-3 h-3" />
                Ready
              </span>
            </div>
            <h2 className="text-[26px] font-semibold tracking-tight mt-1">
              Your ad is ready.
            </h2>
            <p className="text-[14px] text-ink-500 mt-1">
              Download the video, voice, script, or captions below.
            </p>

            <div className="mt-5 space-y-2.5">
              <DownloadRow
                label={`Video (${ext.toUpperCase()})`}
                hint="9:16 · with on-screen captions"
                onClick={() =>
                  downloadBlob(videoBlob, `lumen-ugc-ad.${ext}`)
                }
              />
              <DownloadRow
                label="Voice (MP3)"
                hint="ElevenLabs synthesized narration"
                onClick={() => downloadBlob(audioBlob, "lumen-voice.mp3")}
              />
              <DownloadRow
                label="Script (TXT)"
                hint="Spoken VO copy"
                onClick={() => {
                  const text = `${
                    script.hooks[script.selectedHookIndex] ?? ""
                  }\n\n${fullScriptFromScenes(script.scenes)}\n\n${
                    script.cta
                  }`;
                  downloadBlob(
                    new Blob([text], { type: "text/plain" }),
                    "lumen-script.txt",
                  );
                }}
              />
              <DownloadRow
                label="Captions (SRT)"
                hint="Subtitle file for editors"
                onClick={() => {
                  const srt = buildSrt(script, duration || 30);
                  downloadBlob(
                    new Blob([srt], { type: "application/x-subrip" }),
                    "lumen-captions.srt",
                  );
                }}
              />
            </div>
          </div>

          <div className="card p-6">
            <div className="text-[13px] font-medium text-ink-500 mb-2">
              Selected hook
            </div>
            <p className="text-[15px] leading-snug">
              {script.hooks[script.selectedHookIndex]}
            </p>
            <div className="text-[13px] font-medium text-ink-500 mt-4 mb-2">
              CTA
            </div>
            <p className="text-[15px]">{script.cta}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DownloadRow({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-2xl border border-ink-100 bg-white px-4 py-3 hover:border-ink-300 transition group"
    >
      <div className="text-left">
        <div className="text-[14px] font-medium text-ink-900">{label}</div>
        <div className="text-[12px] text-ink-500">{hint}</div>
      </div>
      <span className="w-9 h-9 rounded-full bg-ink-900/5 grid place-items-center group-hover:bg-ink-900 group-hover:text-white transition">
        <Download className="w-4 h-4" />
      </span>
    </button>
  );
}

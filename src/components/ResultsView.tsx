import { useEffect, useRef, useState, type SyntheticEvent } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoError, setVideoError] = useState<string>("");
  const [muted, setMuted] = useState(true);

  // Create and revoke the blob URL in the same effect so StrictMode's
  // setup→cleanup→setup cycle doesn't revoke the URL the <video> is using.
  useEffect(() => {
    const v = URL.createObjectURL(videoBlob);
    setVideoUrl(v);
    setVideoError("");
    return () => URL.revokeObjectURL(v);
  }, [videoBlob]);

  // MediaRecorder-produced WebM/fMP4 frequently have duration:Infinity, which
  // prevents <video> from showing a first frame or scrubbing. Seeking past the
  // end forces the browser to re-scan and report the real duration, after
  // which playback works.
  function handleLoadedMetadata(e: SyntheticEvent<HTMLVideoElement>) {
    const el = e.currentTarget;
    if (!isFinite(el.duration) || el.duration === 0) {
      const onSeeked = () => {
        el.removeEventListener("seeked", onSeeked);
        el.currentTime = 0;
        setDuration(el.duration || 0);
        el.play().catch(() => {});
      };
      el.addEventListener("seeked", onSeeked);
      el.currentTime = Number.MAX_SAFE_INTEGER;
    } else {
      setDuration(el.duration || 0);
      el.play().catch(() => {});
    }
  }

  function toggleMute() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
    el.play().catch(() => {});
  }

  function handleVideoError(e: SyntheticEvent<HTMLVideoElement>) {
    const err = e.currentTarget.error;
    const codeMap: Record<number, string> = {
      1: "MEDIA_ERR_ABORTED",
      2: "MEDIA_ERR_NETWORK",
      3: "MEDIA_ERR_DECODE",
      4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
    };
    const reason = err
      ? `${codeMap[err.code] ?? `code ${err.code}`}${
          err.message ? `: ${err.message}` : ""
        }`
      : "Unknown video error";
    setVideoError(
      `${reason} · blob type: "${videoBlob.type || "(none)"}" · ${
        videoBlob.size
      } bytes`,
    );
  }

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
            <div className="rounded-2xl overflow-hidden bg-ink-900 aspect-[9/16] max-h-[80vh] mx-auto relative">
              {videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    playsInline
                    autoPlay
                    muted={muted}
                    loop
                    preload="auto"
                    className="w-full h-full object-contain bg-black"
                    onLoadedMetadata={handleLoadedMetadata}
                    onError={handleVideoError}
                  />
                  {muted && !videoError && (
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="absolute top-3 right-3 z-10 rounded-full bg-black/60 hover:bg-black/80 text-white text-[12px] font-medium px-3 py-1.5 backdrop-blur-sm transition"
                    >
                      Tap to unmute
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full h-full grid place-items-center text-ink-500 text-sm">
                  Preparing preview…
                </div>
              )}
              {videoError && (
                <div className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white text-[12px] px-3 py-2 leading-snug">
                  Preview failed: {videoError}. The downloaded file should still
                  work.
                </div>
              )}
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

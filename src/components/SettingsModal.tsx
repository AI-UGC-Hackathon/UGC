import { useEffect, useState } from "react";
import { type ApiKeys, loadKeys, saveKeys } from "../lib/storage";
import { DEFAULT_VOICES, fetchUserVoices, type ElevenVoice } from "../lib/elevenlabs";
import { X } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (keys: ApiKeys) => void;
};

export function SettingsModal({ open, onClose, onSaved }: Props) {
  const [keys, setKeys] = useState<ApiKeys>(loadKeys());
  const [voices, setVoices] = useState<ElevenVoice[]>(DEFAULT_VOICES);
  const [loadingVoices, setLoadingVoices] = useState(false);

  useEffect(() => {
    if (open) setKeys(loadKeys());
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    if (open && keys.elevenKey) {
      setLoadingVoices(true);
      fetchUserVoices(keys.elevenKey).then((v) => {
        if (!cancelled) {
          setVoices(v);
          setLoadingVoices(false);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [open, keys.elevenKey]);

  if (!open) return null;

  const handleSave = () => {
    saveKeys(keys);
    onSaved(keys);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm animate-fadeUp"
      onClick={onClose}
    >
      <div
        className="card w-[min(560px,calc(100vw-32px))] p-7 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
            <p className="text-[14px] text-ink-500 mt-1">
              Keys are stored only in your browser's localStorage.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full w-8 h-8 grid place-items-center text-ink-500 hover:bg-ink-900/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="label">
              Gemini API key{" "}
              <span className="text-ink-300 normal-case font-normal">
                · required for script generation
              </span>
            </label>
            <input
              type="password"
              className="input mt-1.5"
              placeholder="AIza..."
              value={keys.geminiKey}
              onChange={(e) =>
                setKeys((k) => ({ ...k, geminiKey: e.target.value }))
              }
            />
            <p className="text-[12px] text-ink-500 mt-1.5">
              Get one at{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                aistudio.google.com/apikey
              </a>
            </p>
          </div>

          <div>
            <label className="label">ElevenLabs API key</label>
            <input
              type="password"
              className="input mt-1.5"
              placeholder="sk_..."
              value={keys.elevenKey}
              onChange={(e) =>
                setKeys((k) => ({ ...k, elevenKey: e.target.value }))
              }
            />
            <p className="text-[12px] text-ink-500 mt-1.5">
              Powers the influencer voiceover. Get one at{" "}
              <a
                href="https://elevenlabs.io/app/settings/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                elevenlabs.io/app/settings/api-keys
              </a>
            </p>
          </div>

          <div>
            <label className="label">
              Exa API key{" "}
              <span className="text-ink-300 normal-case font-normal">
                · optional research enrichment
              </span>
            </label>
            <input
              type="password"
              className="input mt-1.5"
              placeholder="00000000-..."
              value={keys.exaKey}
              onChange={(e) =>
                setKeys((k) => ({ ...k, exaKey: e.target.value }))
              }
            />
            <p className="text-[12px] text-ink-500 mt-1.5">
              Powers the optional "Research with Exa" step before script
              generation. Get one at{" "}
              <a
                href="https://dashboard.exa.ai"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                dashboard.exa.ai
              </a>
            </p>
          </div>

          <div>
            <label className="label">
              fal.ai API key{" "}
              <span className="text-ink-300 normal-case font-normal">
                · optional · powers AI video generation
              </span>
            </label>
            <input
              type="password"
              className="input mt-1.5"
              placeholder="key_id:key_secret"
              value={keys.falKey}
              onChange={(e) =>
                setKeys((k) => ({ ...k, falKey: e.target.value }))
              }
            />
            <p className="text-[12px] text-ink-500 mt-1.5">
              Powers the video itself. Lumen sends your script and uploaded
              product photo to Veo 3 (via fal.ai) to render an 8-second 9:16
              UGC clip. Get a key at{" "}
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                fal.ai/dashboard/keys
              </a>
            </p>
          </div>


          <div>
            <label className="label">Voice</label>
            <select
              className="input mt-1.5"
              value={keys.voiceId}
              onChange={(e) =>
                setKeys((k) => ({ ...k, voiceId: e.target.value }))
              }
            >
              {voices.map((v) => (
                <option key={v.voice_id} value={v.voice_id}>
                  {v.name}
                </option>
              ))}
            </select>
            {loadingVoices && (
              <p className="text-[12px] text-ink-500 mt-1.5">Loading your voices…</p>
            )}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

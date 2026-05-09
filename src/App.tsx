import { useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { UploadCard } from "./components/UploadCard";
import { PromptForm } from "./components/PromptForm";
import { WorkflowSteps } from "./components/WorkflowSteps";
import { SettingsModal } from "./components/SettingsModal";
import { ScriptReview } from "./components/ScriptReview";
import { GenerationView } from "./components/GenerationView";
import { ResultsView } from "./components/ResultsView";
import type {
  CampaignBrief,
  ProductImage,
  Script,
  Stage,
} from "./types";
import { generateScript } from "./lib/gemini";
import { fullScriptFromScenes } from "./lib/scriptUtils";
import { synthesizeVoice } from "./lib/elevenlabs";
import { composeVideo } from "./lib/videoComposer";
import { buildFalPrompt, generateFalVideo } from "./lib/fal";
import {
  type ApiKeys,
  ensureSeeded,
  loadKeys,
  loadPersonaId,
  savePersonaId,
} from "./lib/storage";
import { getPersona } from "./lib/personas";
import type { GenStep } from "./components/GenerationView";

ensureSeeded();

const DEFAULT_BRIEF: CampaignBrief = {
  productDescription: `【Auto Magnetic Stirring Coffee Mug】This is a life saver to lazy people. No need for a spoon, just add your favorite Powders (Bulletproof coffee, butter, coconut oil, heavy cream, etc.) to the cup, press the button, and you can enjoy drinks whether at home, office, gym, school, etc.

【Support Magnetic Charging】The third-generation automatic stirring cup supports magnetic adsorption charging. Once charged, it can be used 60 times. There is no need to replace the battery frequently, which is more environmentally friendly, water doesn't seep into the battery area and is safer.

【Easy to operate】Press button to start automatic stirring. Stirring without splashing, automatically stops in 30 seconds. Separable magnetic Stir Bar, corrosion-resistant, easy to clean, tested and strongly adsorbed to the bottom of the cup, avoid swallow. Includes 2pc Stir Bars for long lifespan.`,
  audience: "Coffee lovers aged 20–60",
  platform: "TikTok",
  tone: "Testimonial",
  duration: 30,
  angle: `This mug is a total game changer for lazy people like me!
First, I add water or any liquid — super easy.
Then I add my favorite powders. I'm using coffee and collagen today.
Just press the button... and it stirs automatically!
No spoon. No clumps. Just smooth, perfect drinks.
It mixes everything so well — creamy, smooth, and delicious.
It's USB magnetic charging, comes with extra stir bars, and lasts long!
Perfect for home, office, gym, or school. Seriously, you need this!
Grab yours now — link in bio or check the comments!`,
  notes: "",
  personaId: loadPersonaId(),
  researchNotes: "",
};

export default function App() {
  const [stage, setStage] = useState<Stage>("landing");
  const [keys, setKeys] = useState<ApiKeys>(loadKeys());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [images, setImages] = useState<ProductImage[]>([]);
  const [brief, setBrief] = useState<CampaignBrief>(DEFAULT_BRIEF);
  const [script, setScript] = useState<Script | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [genStep, setGenStep] = useState<GenStep>("voice");
  const [genProgress, setGenProgress] = useState(0);
  const [genMessage, setGenMessage] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const hasKeys = Boolean(keys.geminiKey && keys.elevenKey && keys.falKey);

  const steps = useMemo(() => {
    const map = { landing: 0, review: 1, generating: 2, results: 3 };
    const cur = map[stage];
    return [
      { label: "Upload images", done: cur > 0, active: cur === 0 },
      { label: "Generate script", done: cur > 1, active: cur === 1 },
      { label: "Review & edit", done: cur > 1, active: cur === 1 },
      { label: "Create video", done: cur > 2, active: cur >= 2 },
    ];
  }, [stage]);

  useEffect(() => {
    savePersonaId(brief.personaId);
  }, [brief.personaId]);

  useEffect(() => {
    if (stage === "landing" && !hasKeys) {
      const t = setTimeout(() => setSettingsOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [stage, hasKeys]);

  async function handleGenerateScript() {
    setError(null);
    if (!keys.geminiKey) {
      setSettingsOpen(true);
      setError("Add your Gemini API key in Settings.");
      return;
    }
    if (images.length === 0) {
      setError("Upload at least one product photo first.");
      return;
    }
    setScriptLoading(true);
    try {
      const s = await generateScript({
        apiKey: keys.geminiKey,
        brief,
        images,
      });
      setScript(s);
      setStage("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Script generation failed");
    } finally {
      setScriptLoading(false);
    }
  }

  async function handleApprove() {
    if (!script) return;
    if (!keys.elevenKey) {
      setSettingsOpen(true);
      setError("Add your ElevenLabs API key in Settings.");
      return;
    }
    if (!keys.falKey) {
      setSettingsOpen(true);
      setError("Add your fal.ai API key in Settings.");
      return;
    }
    if (images.length === 0) {
      setError("Upload at least one product image to send to fal.ai.");
      return;
    }
    setError(null);
    setStage("generating");

    const persona = getPersona(brief.personaId);
    const hook = script.hooks[script.selectedHookIndex] ?? "";

    try {
      const voiceText = fullScriptFromScenes(script.scenes) || hook;

      const falPrompt = buildFalPrompt({
        productDescription: brief.productDescription,
        audience: brief.audience,
        tone: brief.tone,
        platform: brief.platform,
        angle: brief.angle,
        personaStyleNotes: persona.styleNotes,
        hook,
        scenes: script.scenes.map((s) => ({
          voiceLine: s.voiceLine,
          description: s.description,
          acting: s.acting,
        })),
      });

      setGenStep("video");
      setGenProgress(0.02);
      setGenMessage("Sending product image to fal.ai · Veo 3…");

      const falBlob = await generateFalVideo({
        apiKey: keys.falKey,
        prompt: falPrompt,
        image: images[0],
        onProgress: (msg, p) => {
          setGenMessage(msg);
          setGenProgress(p * 0.7);
        },
      });

      setGenStep("voice");
      setGenMessage("Synthesizing influencer voice with ElevenLabs…");
      setGenProgress((p) => Math.max(p, 0.72));

      const audio = await synthesizeVoice({
        apiKey: keys.elevenKey,
        voiceId: persona.voiceId,
        text: voiceText,
      });
      setAudioBlob(audio);
      setGenProgress(0.88);

      setGenStep("video");
      setGenMessage("Compositing fal.ai footage with your voice…");

      const result = await composeVideo({
        mode: { kind: "video", source: falBlob },
        hook,
        cta: script.cta,
        audio,
        onProgress: (p) => {
          setGenProgress(0.88 + p * 0.12);
        },
      });
      setVideoBlob(result.videoBlob);
      setGenProgress(1);
      setStage("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Video generation failed");
    }
  }

  function handleRestart() {
    setStage("landing");
    setImages([]);
    setBrief(DEFAULT_BRIEF);
    setScript(null);
    setAudioBlob(null);
    setVideoBlob(null);
    setError(null);
    setGenProgress(0);
  }

  function handleNewVariation() {
    setVideoBlob(null);
    setStage("review");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onLogo={handleRestart}
        hasKeys={hasKeys}
      />

      <main className="flex-1">
        {stage === "landing" && (
          <>
            <Hero
              onPrimary={() => {
                document
                  .getElementById("create")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />

            <div id="create" className="mx-auto max-w-6xl px-6 pb-24">
              <div className="mb-6">
                <WorkflowSteps steps={steps} />
              </div>

              {error && (
                <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-700">
                  {error}
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                <UploadCard images={images} onChange={setImages} />
                <PromptForm
                  brief={brief}
                  onChange={setBrief}
                  onGenerate={handleGenerateScript}
                  canGenerate={images.length > 0 && hasKeys}
                  isGenerating={scriptLoading}
                  exaKey={keys.exaKey}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
              </div>

              {!hasKeys && (
                <div className="mt-6 card p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-[15px] font-medium">
                      Connect your API keys to get started
                    </div>
                    <div className="text-[13px] text-ink-500">
                      Required: Gemini (script), fal.ai (video), and ElevenLabs
                      (voice). Optional: Exa (research). Keys never leave this
                      device.
                    </div>
                  </div>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="btn-primary"
                  >
                    Add API keys
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {stage === "review" && script && (
          <div className="pt-8">
            <div className="mx-auto max-w-7xl px-6 mb-6">
              <WorkflowSteps steps={steps} />
            </div>
            <ScriptReview
              apiKey={keys.geminiKey}
              brief={brief}
              images={images}
              script={script}
              onChange={setScript}
              onBack={() => setStage("landing")}
              onApprove={handleApprove}
            />
          </div>
        )}

        {stage === "generating" && (
          <GenerationView
            step={genStep}
            progress={genProgress}
            message={genMessage}
            error={error}
            onCancel={() => {
              setError(null);
              setStage(script ? "review" : "landing");
            }}
          />
        )}

        {stage === "results" && videoBlob && audioBlob && script && (
          <div className="pt-8">
            <div className="mx-auto max-w-6xl px-6 mb-6">
              <WorkflowSteps steps={steps} />
            </div>
            <ResultsView
              videoBlob={videoBlob}
              audioBlob={audioBlob}
              script={script}
              onRestart={handleRestart}
              onNewVariation={handleNewVariation}
            />
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-[12px] text-ink-300">
        Lumen runs in your browser. Script by Gemini · Video by fal.ai · Voice
        by ElevenLabs.
      </footer>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={(k) => setKeys(k)}
      />
    </div>
  );
}

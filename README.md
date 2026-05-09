# Lumen — AI UGC Studio

A 100% client-side SPA that turns product photos into a finished UGC ad —
script, voice, and video — without a backend.

- **Gemini** writes the hooks, script, scene breakdown and CTA from your photos and brief.
- **ElevenLabs** synthesizes the influencer voiceover.
- The browser composes a 9:16 vertical video (Canvas + MediaRecorder + WebAudio) with on-screen captions.

Apple-inspired UI: white canvas, generous whitespace, rounded cards, soft shadows, SF Pro / Inter typography.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (custom Apple-leaning theme)
- `@google/generative-ai` for Gemini
- ElevenLabs REST API (direct from the browser)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 and add your API keys in **Settings** (top right).
Keys are stored only in your browser's `localStorage`.

- Get a Gemini key: https://aistudio.google.com/apikey
- Get an ElevenLabs key: https://elevenlabs.io/app/settings/api-keys

## Flow

1. **Upload** product photos (front / back / side / packaging — up to 8).
2. **Brief**: audience, platform, tone, duration, marketing angle.
3. Gemini returns 5 hooks + spoken script + 4–6 scenes + CTA. Edit anything inline.
4. **Approve** → ElevenLabs voices the script → the browser composes a 1080×1920 video with Ken-Burns motion and captions.
5. **Download** the video, the voice, the script, and an SRT caption file.

## Notes / limits

- Output container is `webm` on Chrome/Firefox and `mp4` on Safari (whatever `MediaRecorder` supports). Re-encode via ffmpeg if you need strict MP4 everywhere.
- Everything runs in the browser; there is no server, no auth, no storage. Refreshing the page loses in-progress work (by design — privacy first).
- The video is a Ken-Burns slideshow over your product photos with the hook caption at the top and the CTA at the bottom. For true generative video (Veo) you would need a backend with a Veo-enabled key.

## Build

```bash
npm run build
npm run preview
```

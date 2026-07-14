# Phase 10 — HAPPY Digital Human Operating System (HDHOS)

HDHOS is the signature surface of HAPPY X. **HAPPY is the only digital human on
the platform.** Every "role" you see in the UI (Teacher, Consultant, Founder
Assistant, Public Speaker, …) is a **mode / capability of HAPPY** — never a
different character, never a different name.

## Rules (permanent)

1. **One identity.** HAPPY. Modes are capabilities; personalities are tone
   shifts within HAPPY.
2. **All AI calls go through the Lovable AI Gateway.** No provider is called
   directly. `LOVABLE_API_KEY` is server-only.
3. **No claims about the user's emotional state.** Emotion adaptation is opt-in
   via `dh_preferences.emotion_adaptation` and never asserts a state.
4. **No recording without explicit consent.** Camera / microphone consent are
   opt-in flags on `dh_preferences`. No biometric identification. No hidden
   background processing.
5. **Every function goes through the shared service layer** (`requireSupabaseAuth`
   + Zod). No UI ever talks to the database directly.

## Architecture

```
UI (react)
  └─ /digital-human/*  (route layout + tabs)
     └─ HappyAvatar (CSS/SVG, GPU-friendly)
     └─ useHappySpeech (SSE/PCM playback from /api/dh/tts)
     └─ Whiteboard (native canvas, PNG export)
        │
        ▼
Server (TanStack)
  ├─ src/lib/digital-human-v1.functions.ts   (createServerFn RPCs)
  └─ src/routes/api/dh.tts.ts                (SSE proxy to Lovable AI TTS)
        │
        ▼
Data (Supabase)
  ├─ dh_sessions       (per-user conversations, RLS: self)
  ├─ dh_preferences    (per-user settings + consent, RLS: self)
  └─ dh_presentations  (AI-generated decks, RLS: self)
```

## Route tree

| Route | Surface |
|---|---|
| `/digital-human` | Conversation (avatar + modes + voice) |
| `/digital-human/classroom` | HAPPY teaches with whiteboard + voice |
| `/digital-human/boardroom` | Executive consulting modes |
| `/digital-human/presentation` | Generate & narrate slide decks |
| `/digital-human/whiteboard` | Full-canvas whiteboard w/ HAPPY beside it |
| `/digital-human/sessions` | Conversation history + delete |
| `/digital-human/settings` | Voice, accessibility, memory, consent |

## Mode inventory (18)

`assistant, teacher, professor, mentor, tutor, business, coach, coding,
language, culture, research, creator, enterprise, founder, presentation,
public_speaker, interview, support`

## Animation inventory

Avatar animations are pure CSS + minimal `requestAnimationFrame` — no external
3D dependencies, no WebGL. All motion respects `dh_preferences.reduced_motion`.

- Idle **breathing** (5.5s ease-in-out)
- Natural **blink** loop (2.2–5.7s cadence, 130ms close)
- **Mouth open/close** amplitude tied to the speaking activity flag
- Speaking **pulse ring** halo (1.4s ease-out)
- Expression tokens: neutral / smile / thinking / explain / concern / celebrate / listen
- Gaze micro-motion for `thinking`

## Voice inventory

- Provider: `openai/gpt-4o-mini-tts` via Lovable AI Gateway.
- Voices exposed: `alloy, ash, ballad, coral, echo, sage, shimmer, verse`.
- Speed: 0.5×–2.0×. Language: 9 language codes shipped, extensible.
- Transport: **SSE / PCM 24 kHz** streamed from `/api/dh/tts` → decoded chunk-by-chunk
  in the browser AudioContext for low-latency playback.
- Cancellation: `stop()` aborts the fetch and clears the schedule.

## Performance summary

- Zero WebGL / 3D deps → no framebuffer cost.
- Avatar animates via `transform` / `opacity` only.
- Presentations load slide-by-slide; only the current slide is rendered.
- TTS streams progressively; first audio typically begins within one chunk.
- Whiteboard canvas is sized to devicePixelRatio; drawing uses pointer events.

## Security summary

- All server RPCs are `requireSupabaseAuth` + Zod validated.
- RLS on every table: rows are strictly scoped to `auth.uid()`.
- TTS proxy never exposes `LOVABLE_API_KEY`; it lives only in server env.
- Camera / mic access is behind explicit consent flags; no default capture.
- No biometric identification; no background telemetry.
- HAPPY never asserts an emotional state without an explicit signal.

## Accessibility summary

- Captions on by default; togglable per user.
- Reduced-motion pref disables every animation.
- High-contrast pref adds a gold outline to conversation panels.
- Large-text pref bumps caption font size.
- Full keyboard control: Enter to send; Shift+Enter for a newline; every
  control is a native `<button>` / `<input>` / `<textarea>`.

## Testing summary

- Unit-safe: pure server functions (Zod-validated inputs → Supabase writes).
- Manual verification: send a message → HAPPY replies with captions, avatar
  transitions `thinking → explain → neutral`, TTS streams if unmuted.
- Regression guard: switching modes never changes HAPPY's identity string
  (system prompt bakes `IDENTITY` on every call).

## Documentation summary

- This file: architecture, modes, animations, voice, security.
- In-code JSDoc on every service function and every avatar component.

## Deliverables checklist

- [x] Digital Human Architecture
- [x] Animation Engine (`HappyAvatar.tsx`)
- [x] Voice Engine (`useHappySpeech.ts` + `/api/dh/tts`)
- [x] Gesture / Expression Engine (expression tokens in avatar + `dhSpeak` returns `expression`)
- [x] Whiteboard Engine (`Whiteboard.tsx`)
- [x] Presentation Engine (`dhGeneratePresentation` + presentation route)
- [x] Teaching Engine (Classroom route + Teacher/Professor/Mentor/Tutor modes)
- [x] Accessibility Report (above)
- [x] Security Report (above)
- [x] Performance Report (above)
- [x] Documentation (this file)

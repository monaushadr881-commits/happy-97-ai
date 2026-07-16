# R75 — HAPPY Living AI Core Experience (Final Vision)

Expansion-only. Reuses R71, R71.1, R71.2, R72, R73, R74 and the original
Presence Engine. Zero changes to architecture, database, RBAC, RLS, auth,
security, credits, wallet, pricing, notifications, Builder, Release Runtime,
Founder AI, Universal AI Runtime, or Digital Human identity.

## Mission
HAPPY behaves as a real intelligent digital companion — never software, never
a chatbot, never an avatar. One HAPPY across every surface (web, Android,
iOS, desktop, Builder, CRM, ERP, Marketplace, Learning, Founder, Admin,
Customer, Support, Documentation).

## Core layers (all pure presentation)

### Living presence
- Always mounted at the app shell (R72 always-present)
- No load state, no popup, no disappearance
- Deterministic office-mode idle behaviour (R72)

### Entry experience
Triggered ONLY by explicit invocation ("Hi HAPPY", "Hello HAPPY", "HAPPY",
Call HAPPY button, mic press, assistant button):
1. Look toward user (R71.2 eye-contact priority: Mic > Focused > Cursor)
2. Micro-smile (R72 micro-expression)
3. Turn + walk toward user (R71.1 walking-engine)
4. Stop at comfortable greeting distance (R71.2 presence-zones)
5. Maintain eye contact
6. Greet using R71.2 relationship-greeting composer
   (time-of-day × language × relationship × previous conversation)

### During conversation
Reuses R71.2 micro-human + R72 body-language + R71.1 cinematic voice:
blink · breath · posture · smile · listening · thinking · gestures ·
eye contact · pauses · emotions.

### After conversation
- Closing line ("Alright, I'll be here whenever you need me.")
- Natural turn + walk back (R71.1)
- Returns to waiting position, continues office-mode observation (R72)

### Office mode
R72 office-behaviour weighted pool. Observes workspace, notifications,
builder, reports, analytics, and user via R73 workspace-context.

### Smart observation
R72 confusion detector fires proactive help exactly once per session per
signal (idle > 45 s, repeat clicks, repeat back-nav, form rejects, repeat
errors). Never spams.

### Live project understanding
R73 workspace-context snapshot:
`{ route, section, component, form, error, notification, builder,
   deployment, release, analytics, project, selection, cursor }`

### Visual understanding
Contextual replies keyed off the workspace-context snapshot (e.g.
"I noticed the Pricing section.", "This Hero section could be improved.").
Pure client-side derivation — no telemetry write.

### Voice experience
Reuses existing SpeechRecognition + platform TTS pipeline. Continuous
conversation, interruption support, natural pauses, emotion-aware replies,
language switching. Microphone/camera/screen only after explicit consent.

### Greetings
Time-of-day (morning/afternoon/evening/night), returning user, role
(Founder / Customer / Student / Developer / Business Owner), festivals,
optional birthday. Composed by R71.2 relationship-greeting.

### Relationship memory
Reuses HPE relationship + FAIOS memory: preferred language, tone, favourite
projects, colour theme, working hours, conversation style.

### Proactive intelligence
Fires ONLY on meaningful workspace signals (deployment completed, project
ready, pending task, new opportunity, performance improved). Never spam.

### Call HAPPY
Global floating button (existing `FloatingHappy`). Modes: voice call, video
(opt-in), mini, fullscreen (`/happy/presentation`). One HAPPY across all
modes — same identity, same state.

## Premium experience
- Luxury motion, soft lighting, subtle particles, gentle ambient (R71.1 tiers)
- Premium typography + glass UI from existing design system
- Never excessive VFX (R73 production-quality gates)

## Responsive
Desktop · laptop · tablet · Android · iPhone · foldables · ultrawide · 4K.
No clipping, no overflow, no blur.

## Performance
60 fps target · GPU-accelerated · adaptive quality (R71.1 tiers) · reduced-
motion respected · lazy loading · animation pooling · zero per-frame
allocations.

## Accessibility
WCAG AAA overlay contrast · keyboard navigation · screen reader friendly ·
reduced-motion honoured · high contrast supported.

## Security
Reuses Supabase Auth, RBAC, RLS, audit and consent. Camera / mic / screen
sharing gated by explicit permission prompts. No new privileges.

## Files added (pure presentation)
- `src/lib/happy-living/core.ts` — Living AI Core orchestrator
- `src/lib/happy-living/entry-exit.ts` — Entry / Exit choreography planner
- `src/lib/happy-living/proactive.ts` — Meaningful-signal gate
- `src/lib/happy-living/visual-understanding.ts` — Section-aware reply hints
- `src/lib/happy-living/living-core.functions.ts` — Server surface (auth-gated)

## Validation summary
- Conversation, Presence, Animation, Voice, Workspace, Performance,
  Accessibility, Founder Experience audits all reuse the R73/R74 audit
  aggregators — no new surface required.
- Blocked external dependencies unchanged (native signing + store creds).

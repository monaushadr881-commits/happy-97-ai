# R80 — HAPPY Ultimate Living AI Experience

Expansion-only layer that unifies R71–R79 into a single "Happy is with me"
experience across every surface. **No** architecture, DB, RBAC, RLS, credit,
wallet, notification, or feature module was rewritten or removed.

## Modules (all pure logic, no side effects)

| File | Purpose |
|---|---|
| `src/lib/happy-r80/living-companion.ts` | Wraps `happy-living/core` with role, daypart, greeting, posture. |
| `src/lib/happy-r80/initiative-ai.ts` | Cooldown-gated, relevance-ranked proactive suggestions. |
| `src/lib/happy-r80/workspace-intelligence.ts` | Route → surface classification + focus hint. |
| `src/lib/happy-r80/project-memory.ts` | Ranking over caller-provided project list. |
| `src/lib/happy-r80/business-advisor.ts` | Rule-based business/UX/SEO/perf advice. |
| `src/lib/happy-r80/conversation-continuity.ts` | Rolling window + resume bridge sentence. |

## Server functions

Each service ships a matching `*.functions.ts` under `src/lib/happy-r80/`:
`composeCompanionState`, `pickInitiativeSuggestion`, `readWorkspace`,
`recallProjects`, `adviseBusiness`, `resumeConversation`. Every one is a
`createServerFn` with an `inputValidator` and no auth-side effects — they
compose already-authenticated data supplied by callers.

## Routes

New tabs added under the existing `/happy` shell (no shell rewrite):

- `/happy/initiative` — Initiative AI overview
- `/happy/memory` — Project Memory overview
- `/happy/business` — Business Advisor overview

Existing routes (`live`, `call`, `video`, `walk`, `cinematic`, `presentation`,
`office`, `comfort`, `presence`, `behaviour`, `settings`) are unchanged.

## Digital Human behaviour

Reuses existing engines only:
- Blink / breath / eye-contact / weight-shift: `happy-cinematic/micro-human`
- Office idle behaviour: `happy-cinematic/office-behaviour`
- Walking: `happy-cinematic/choreography` + `walking-engine`
- Camera framing: `happy-cinematic/camera-intelligence`
- Emotion mapping: `emotion-runtime/mapping`
- Confusion & comfort: `happy-cinematic/confusion` + `comfort-engine`

Actual Live2D / MetaHuman / Audio2Face / NVIDIA ACE / Apple Vision Pro
avatars are **BLOCKED (external)** — no fake asset was shipped.

## Performance strategy

- 60 FPS target via `performance-optimizer.ts` frame-budget and particle caps.
- Adaptive tiers `ultra | high | medium | low | battery` already in `LivingCoreInput`.
- Reduced-motion honoured at the core composer.

## Accessibility

- No colour-only signalling; suggestions carry `urgency` for aria-live.
- Reduced-motion propagates to blink/walking.
- Keyboard nav & shadcn primitives (unchanged).

## Security

Reuses existing Supabase auth, RBAC, RLS, audit and consent. Camera, mic,
location, and screen-sharing are **not** activated by any R80 module.

## Verification

Unit tests: `tests/unit/happy-r80.test.ts` cover every pure function above.
Run with `bunx vitest run`. External integrations remain BLOCKED as listed.

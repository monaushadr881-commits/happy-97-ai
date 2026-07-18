# R117 — HAPPY Digital Human Intelligence

Status: **DELIVERED** (extension-only). No new avatar, no new VRM, no new
animation engine.

## Canonical owners (unchanged)

| Capability | Owner |
|------------|-------|
| VRM renderer | `src/components/digital-human/HappyVRM.tsx` |
| Fallback renderer | `src/components/digital-human/HappyAvatar.tsx` |
| Behaviour / pacing / gestures | `src/components/digital-human/conversation-engine.ts` |
| Speech (TTS) | `src/components/digital-human/useHappySpeech.ts` + `/api/dh/tts` |
| STT | `src/components/digital-human/useVoiceInput.ts` + `/api/happy-stt` |
| Cinematic subsystems | `src/lib/happy-cinematic/*` (camera, lighting, walking, greeting, presence, comfort, VFX, particles) |
| Idle micro-motion | `src/lib/happy-r112/dh-extensions.ts` |
| Living presence anchors | `src/lib/happy-r89/*`, `src/lib/happy-living/*` |

## Gap report

| Phase | Owner exists | Gap closed by R117 |
|-------|---------------|--------------------|
| 3 Natural idle | `dh-extensions.ts` (blink/breath) + micro-expression cinematic | Added `idleTelemetry(persona)` selector |
| 4 Conversation behaviour | `conversation-engine.postureFor` | Added `behaviourFor(state, intent)` with agreement/celebration/concern |
| 5 Gesture intelligence | `conversation-engine.gestureFor(intent)` | Added `gestureIntelligence(intent, context)` — deterministic per-context |
| 6 Relationship | `happy-cinematic/relationship-greeting.*` | Added `relationshipTier` + `memoryAwareGreeting` |
| 7 Environment | `happy-cinematic/ambient-environment.*` | Added `pickEnvironment` selector (7 scenes) |
| 8 Presentation | `Whiteboard.tsx`, presentation-slides tables | Added `presentationFor(intent, mode)` selector |
| 9 Cinematic entry | `happy-cinematic/walking-engine`, choreography | Added `pickEntry` (opt-in, user-configurable, defaults to "none") |
| 10 Voice personality | `voiceProfileFor(mode)` | Added `voicePersonality` layering emotion/confidence/pause |
| 11 Analytics | `voice_analytics_snapshots` table | Added `analyticsSnapshot(frames)` p95 + gesture/expression histogram |

## Duplicate detection

Historical versioned siblings (`digital-factory-v10`, `digital-human-v1`,
`digital-twin-v4`, `digital-twin-v11`, `happyx-chat.functions.ts`) remain
`@deprecated` under R91/R111. R117 does **not** touch them and does **not**
add new versioned siblings.

## Performance / rendering risks

- `analyticsSnapshot` is O(n) over a bounded frame buffer; caller keeps
  ring-buffer ≤ 300 frames.
- `idleTelemetry` returns constants — no per-frame allocation.
- All selectors are pure; safe to call inside render.

## Files changed

- Added `src/lib/happy-r117/dh-intelligence.ts` (pure selectors).
- Added `tests/unit/happy-r117.test.ts` (10 tests, green).
- Added `docs/digital-human/R117_DH_INTELLIGENCE.md` (this file).

## Backward compatibility

All existing DH imports keep working. R117 is additive — call sites opt in
by importing selectors from `@/lib/happy-r117/dh-intelligence`.

## Known limitations / remaining work

- Bone-level facial rig for micro-expressions still depends on VRM asset
  quality (external / BLOCKED per R91).
- BMW M5 entry is a scene id only; the vehicle asset is external / BLOCKED.
- Virtual space and future_lab scenes reuse the office renderer until the
  Founder supplies dedicated environment assets.

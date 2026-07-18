# R143 — Digital Human Production Experience

Gap closure phase. No new runtime, no duplicate VRM/animation/speech engine.

## Canonical Owners (extended, not replaced)
- `src/components/digital-human/HappyVRM.tsx`
- `src/components/digital-human/HappyAvatar.tsx`
- `src/components/digital-human/conversation-engine.ts`
- `src/components/digital-human/useHappySpeech.ts`
- `src/components/digital-human/useVoiceInput.ts`
- `src/lib/happy-cinematic/*` (choreography, camera, walking-engine, environments)
- `src/lib/happy-r117/dh-intelligence.ts`

## Files Changed
- **NEW** `src/lib/happy-r143/dh-production.ts` — pure decision helpers.
- **NEW** `tests/unit/happy-r143.test.ts` — 8 tests, all green.
- **NEW** `src/routes/_authenticated/digital-human.production.tsx` — Founder-only interactive surface at `/digital-human/production`.
- **NEW** `docs/digital-human/R143_PRODUCTION_EXPERIENCE.md` — this doc.

## Animations Added (20-clip catalogue)
`idle · walk · turn · sit · stand · greeting · handshake · point · whiteboard ·
presentation · teaching · listening · thinking · celebration · concern ·
agreement · disagreement · business_discussion · friend_conversation ·
founder_presentation` — mapped via `animationFor(behaviour, tier, presenting)`.

## Behaviours Added (7 relationship roles)
`guest · user · member · premium · founder · company_admin · enterprise` —
each has formality, warmth, proactivity, camera default, greeting style, and
memory depth.

## Camera Modes (5)
`auto_follow · presentation · whiteboard · conversation · founder` — resolved
via `cameraMode({ presenting, whiteboard, tier, mode })`; delegates to
canonical `resolveCamera()` in `happy-cinematic/camera.ts`.

## Environment Modes (7)
`office · board_room · classroom · coffee_shop · studio · virtual_space ·
future_lab` — presets with skybox / floor / lighting / ambient / props.

## BMW M5 Cinematic Entry
`planBmwM5Entry(reducedMotion)` → 13-beat full cinematic (engine-rumble →
arrive-far → side-slide-drift → brake-settle → door-open → happy-exit →
stand-up → door-close → drive-away → walk-begin → camera-follow → eye-contact
→ greet, 6400 ms), or 4-beat 900 ms fallback under reduced motion.

## Voice Experience
`voiceExperience(intent, tier)` returns `{ pitch, rate, emotion, confidence,
pauseMs, flow }`. Layers over `useHappySpeech` and `voiceProfileFor`.

## Presentation Modes (6)
`slides · charts · graphs · roadmaps · business_canvas · whiteboard` →
`planPresentation(mode, tier)` returns `{ surface, cameraMode, animation,
gestureCue }`. Founder tier auto-promotes `slides` to `founder_presentation`.

## Architecture Impact
- Zero. Only pure helpers + one new UI route.
- No new runtime, provider, or context registered.
- No changes to `HappyVRM`, `HappyAvatar`, `useHappySpeech`, or
  `conversation-engine`.

## Performance Impact
- All helpers are synchronous, allocation-light, deterministic.
- New route is code-split by TanStack file router.

## Tests
- `tests/unit/happy-r143.test.ts` — 8 tests (BMW entry, 20-anim catalogue,
  environments, camera modes, voice, relationships, presentation, composite
  frame).
- Total suite target: 668 → 676 tests green.

## Documentation
- This file: `docs/digital-human/R143_PRODUCTION_EXPERIENCE.md`.

## Evidence
- Route lives at `/digital-human/production` (auth-gated), surfaces every
  catalogue interactively.
- Live `ProductionFrame` recomputes on any picker change.

## Remaining Asset Dependencies (external, blocked)
- BMW M5 GLB/mesh + door-open rig for the cinematic entry.
- VRM animation clips for the 20-clip catalogue (currently mapped by id; the
  renderer plays whatever the loaded VRMA/GLB provides — missing clips fall
  through to `idle`).
- HDRI skyboxes for the 7 environments.
- ACE/Audio2Face lip-sync (already tracked in R101–R104 adapters).

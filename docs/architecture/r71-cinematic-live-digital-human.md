# R71 — HAPPY Cinematic Live Digital Human Experience (CLDHE) v1.0

Expansion-only module. Reuses existing Digital Human identity, Presence Engine,
Founder AI OS, and Universal AI Builder Runtime. No database, RBAC, RLS,
credits, wallet, pricing, notifications, or authentication changes.

## One HAPPY

There is a single HAPPY identity per platform. All surfaces (landing,
dashboards, builders, CRM, ERP, HRMS, marketplace, docs, settings) mount the
same `<HappyStage>` component, which is a thin, GPU-friendly presentation
layer on top of the existing Presence Engine and Founder AI services.

## Runtime pipeline

```
Trigger (voice / button / hotkey / "Hi HAPPY")
  → cinematicHumanService.enter()
  → walkingAnimationService.walkIn()
  → emotionEngineService.greet()
  → lipSyncService.sync(stream)
  → voiceConversationService.listen()
  → workspaceAwarenessService.contextFor(route)
  → work: FAIOS command pipeline (unchanged)
  → cinematicHumanService.exit() → walkOut() → dock
```

All heavy work (planning, execution, memory, approvals) is delegated to
existing FAIOS / HPE / UABR functions; R71 only adds presentation and
choreography state.

## Modes

`floating`, `sidebar`, `mini`, `dock`, `fullscreen`, `presentation`,
`picture-in-picture`, `meeting`.

## Cinematic states

`idle`, `entering`, `walking`, `listening`, `thinking`, `speaking`,
`working`, `celebrating`, `exiting`.

Never fake thinking: `thinking` is only emitted when the underlying FAIOS
command reports `status === "planning" | "executing"`.

## Media & permissions

Camera, microphone, and screen-share are always opt-in. The stage never
initializes `getUserMedia` until the user activates `Call HAPPY` or Push
To Talk. Reuses existing browser permission prompts.

## External dependencies (out of scope)

Photoreal avatar assets, TTS voice cloning, and viseme streaming are
supplied by the existing Digital Human identity. R71 defines the choreography
contract, not the model weights.

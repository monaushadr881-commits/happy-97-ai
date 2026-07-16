# R72 — HAPPY Human Presence Engine (HPE 2.0)

Expansion-only humanization layer on top of R71 / R71.1 / R71.2 and the
original Presence Engine. No database, RBAC, RLS, security, credits,
wallet, pricing, notifications, authentication, Founder AI, Universal AI
Runtime, or Digital Human identity changes.

## Presence system

HAPPY is always mounted at the app shell level. No load state, no popup,
no "opening" animation on route change — the stage lives across the
router and simply re-plans posture, greeting, and camera when the route
changes.

```
AppShell
 └─ HappyStage (persistent, portalized, GPU-composited)
     ├─ MicroHumanLayer   (R71.2)
     ├─ EyeContactLayer   (R71.2)
     ├─ AmbientEnvLayer   (R71.1 / R71.2)
     ├─ CameraLayer       (R71.2)
     ├─ BehaviourEngine   (R72 — office idle, look-around, glance-to-dialog)
     ├─ BodyLanguageLayer (R72 — poses, gestures)
     ├─ MicroExpression   (R72 — smile/curious/thinking/celebration/concern)
     └─ ComfortEngine     (R72 — reposition to never cover controls)
```

## Office behaviour

Idle schedules chosen from a pool so behaviour never falls into a visible
loop:
- breath / blink (from R71.2)
- glance to notification region
- glance to focused element
- brief look-away (window/room) then return
- small posture / weight shift
- occasional micro-smile
- finger relax

## Confusion detection

Purely presentation-layer heuristics computed from local input events —
no telemetry write:
- idle > 45 s
- ≥ 5 clicks on the same element in 6 s
- ≥ 3 back navigations in 10 s
- ≥ 2 rejected form submissions in 15 s
- ≥ 3 identical errors in 20 s

When triggered, HAPPY politely asks "Can I help you?" once, then remains
silent until the user engages.

## Micro expressions & body language

Weighted state machine over: `smile`, `thinking`, `listening`, `curious`,
`professional`, `celebration`, `concern`. Body language pool: `relaxed`,
`hands-behind`, `hands-front`, `open-gesture`, `pointing`,
`presentation`, `thinking-pose`, `walking`.

## Comfort engine

Every 400 ms the stage re-checks the target position against a rect of
"do-not-cover" nodes (modals, primary CTAs, form controls, toasts,
sticky headers). If overlap > 20 %, the stage slides to the nearest
free anchor with an eased 240 ms transition. Zero CLS: the stage is a
fixed-size portal.

## Workspace awareness

Reuses R71.2 `presence-zones` per-route entry/stop geometry plus a live
context object (route, builder, project, component, errors,
deployment, notifications, role) sourced from existing hooks.

## Time & memory awareness

Time-of-day greetings + festival / weekend / birthday hooks. Memory is
sourced from existing HPE relationship + FAIOS memory — R72 only
composes greetings, it does not persist anything new.

## Accessibility

- WCAG AAA target for all text overlays (uses design tokens)
- `prefers-reduced-motion` disables camera dolly, cloth, footstep
  particles, dynamic light sweeps; keeps blink + eye contact
- High-contrast mode: HAPPY overlays switch to token-based `foreground`
  on `background`
- Full keyboard access: `Meta+Shift+H` opens Call HAPPY; all overlays
  are focusable and screen-reader-labelled

## Performance

- 60 fps target, `requestAnimationFrame` driven
- Per-frame allocations: zero (deterministic schedules)
- Shared textures / animation caches with R71.1
- Battery-saver tier: disables ambient environment sampling,
  drops particle cap to 32

## Multi-device

Adaptive quality tier from R71.1. Stage geometry re-solved on resize;
zone table clamps to viewport safe area on fold / tablet / mobile.

# R73 — HAPPY Production Excellence & Living Intelligence

Expansion-only polish on top of R71/R71.1/R71.2/R72. Zero changes to
architecture, database, RBAC, RLS, security, credits, wallet, pricing,
notifications, Presence Engine, Founder AI, Universal AI Runtime,
Builder Runtime, or Digital Human identity.

## Production standards
- 60 fps target with zero per-frame allocations
- Zero CLS (stage is a fixed portal)
- No console errors, no unhandled promise rejections
- All overlays use design-system tokens (AAA contrast target)

## Animation standards
- Deterministic time-based schedules (no `Math.random` in the frame loop)
- Cooldown-gated action pool prevents visible looping
- Reduced-motion disables camera dolly, cloth, footstep particles

## Human behaviour standards
- Never fake work: `thinking` / `working` are only emitted when a real
  FAIOS / UABR command is `planning | executing`
- Never spam: proactive help fires only on genuine confusion signals
- Never cover important UI: comfort engine re-anchors at 400 ms

## Workspace intelligence
Aggregated context object per tick:
`{ route, section, component, form, error, notification, builder,
   dashboard, report, analytics, selection, cursor }`
Fully derived from existing hooks / DOM — no telemetry write.

## Performance strategy
- Shared runtime: one animation clock, one particle pool, one texture atlas
- LOD per quality tier (ultra / high / medium / low / battery / auto)
- Idle-time work batched behind `requestIdleCallback` where available

## TypeScript migration strategy (documentation only, no runtime change)
Current bottleneck: `src/integrations/supabase/types.ts` is ~20 k lines
and every server-fn module inflates the typecheck graph, pushing
`tsgo`/`tsc --noEmit` past the 180 s harness limit.

Gradual plan (each step is independently shippable):
1. **Split generated types by schema.** Emit
   `src/integrations/supabase/types/{public,auth,storage,…}.ts` and a thin
   `index.ts` re-export. Regenerate on every migration.
2. **Introduce TS project references.** Root `tsconfig.json` composes:
   `tsconfig.app.json` (UI), `tsconfig.server-fns.json`, `tsconfig.routes.json`.
3. **Enable `"incremental": true` + `tsBuildInfoFile`** per project.
4. **Shared type modules** (`@/types/*`) so server-fn files import only
   the schema slices they need, not the full `Database` union.
5. **Remove `sb: any` workarounds only after** the equivalent
   `SupabaseClient<Database>` type is restored per function.

## Testing strategy
Presentation-layer engines (choreography, quality, office, confusion,
comfort, greeting, camera) are pure functions — unit-testable with
`bun test` without a browser. R74 adds route-level Playwright coverage.

## Future avatar integration strategy
R73 exposes hook points; it does not ship a rig. Hooks:
- `useHappySkeleton()` — target bone transforms
- `useHappyHandIK(side)` — hand IK targets
- `useHappyFingerPose(side, digit)`
- `useHappyHeadTrack(target)` — pixel-space target
- `useHappyEyeTrack(target)`
- `useHappyVisemes(stream)` — accepts phoneme stream
Adapters can back these with MetaHuman, NVIDIA ACE, Audio2Face, or a
pure CSS/SVG rig without changing consumers.

# R118 — HAPPY Workspace Intelligence™

**Status:** Delivered. Extension layer over the canonical Workspace runtime.
**Canonical owner:** `src/services/domain/workspace.service.ts` (+ `company.service.ts`, `brand.service.ts`).

## Founder Lock
No Workspace V2. No duplicate Workspace / Project / Company runtime. No new
schema, no new APIs. R118 is a **pure intelligence layer** consumed by the
existing runtime.

## Gap Report (Phase 1)

| Area | Owner | Status | Notes |
|---|---|---|---|
| Workspace CRUD | `workspace.service.ts` | ✅ canonical | reused |
| Companies | `company.service.ts` | ✅ | reused |
| Brands | `brand.service.ts` | ✅ | reused |
| Teams / Depts | `workspaces` + `teams` + `departments` tables | ✅ | reused |
| Roles / Perms | `roles`, `role_assignments`, `role_permissions` | ✅ | R118 adds pure capability map |
| Files | `cms_media`, `content_uploads` | ✅ | reused |
| Chat | conversation engine | ✅ | reused |
| Calendar | `meetings`, `crm_tasks` | ✅ | reused |
| Tasks | `crm_tasks`, `agent_tasks` | ✅ | reused |
| Automation | `automation-runtime-v3` shim → canonical | ✅ | reused |
| Builder | `builder-runtime` | ✅ | reused |
| Analytics | `analytics.service.ts` | ✅ | R118 declares shape |
| Surface detection | `happy-r80/workspace-intelligence.ts` | ✅ | reused |
| Quotas | `happy-r112/workspace-policy.ts` | ✅ | reused |
| Global signals | `happy-r88/context-bus.ts` | ✅ | reused |

**Duplicates detected:** `workspace-v5.functions.ts`, `workspace-v16.functions.ts`
already carry `@deprecated` shim headers (R115.b). No new siblings created.

**Performance risks:** none — helpers are pure and O(1).
**Security risks:** none — no new endpoints. Permissions helper is advisory;
authoritative checks remain in `authz.service.ts` + RLS.
**Permission risks:** capabilities map is a policy *hint*; server-side RLS
remains the enforcement boundary.

## Architecture V2 (Phase 2)

```
route  ─┐
hints  ─┼─▶ resolveForBrain() ─▶ { workspace_type, surface, memory_scopes, hierarchy }
                                        │
                                        ▼
                       brain/engine.ts (Stage 6: LOAD WORKSPACE)
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              memory scopes       DH mode + greeting     analytics shape
```

## Phase Mapping

- **P3 Types:** `WorkspaceType` × 9 (personal…founder) via `classifyWorkspaceType()`.
- **P4 Hierarchy:** `hierarchyPath()` — workspace ▸ company ▸ brand ▸ dept ▸ team ▸ project.
- **P5 Detect current:** `detectContext(route, node, goal)` — reuses R80 surface detector.
- **P6 Switcher:** `planSwitch(from, to)` — preserves memory, AI session, DH.
- **P7 Permissions:** `capabilitiesFor(role)` + `hasCapability(role, cap)` — 8 roles × 13 caps.
- **P8 Memory:** `scopesForSurface()` maps 13-cat R116 model to workspace surfaces.
- **P9 Dashboard:** `DASHBOARD_SECTIONS` — declarative list consumed by UI.
- **P10 Analytics:** `WorkspaceAnalytics` shape + `emptyAnalytics()`.
- **P11 Brain:** `resolveForBrain()` — called by `runBrain()` Stage 6.
- **P12 DH:** `pickDHMode()` + `greetingFor()` — 5 modes.

## Files Changed
- `src/lib/happy-r118/workspace-intelligence.ts` — new pure helpers.
- `tests/unit/happy-r118.test.ts` — coverage.
- `docs/workspace/R118_WORKSPACE_INTELLIGENCE.md` — this document.

## Database / API Impact
None. Zero migrations, zero new endpoints.

## Tests
`tests/unit/happy-r118.test.ts` — 9 cases passing.

## Known Limitations / Remaining Work
- Cross-workspace federation UI (switcher visual) is Future Phase.
- Custom-role capability editor UI is Future Phase — API map is ready.
- Real-time workspace analytics dashboard extends `analytics.service` in a
  future release; shape is already defined here.

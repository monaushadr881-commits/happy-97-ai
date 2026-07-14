# HAPPY Enterprise Edition v4.0 — Global AI Platform

Status: Activated (2026-07-14). Additive over v1.0 → v3.2. Nothing frozen was modified.

## Principle

HAPPY remains the ONLY Digital Human. Business, Education, Knowledge,
Creator, Research, Support, Founder, Automation, Enterprise, Developer,
Plugins, Skills, Cloud, IoT and Digital Twin are internal capabilities of
HAPPY — never secondary assistants.

## Architecture

v4.0 activates the remaining reserved contracts through the Enterprise
Brain kernel (`src/brain/kernel.ts`). Every new v4 service is produced by
the shared `activated(module)` factory in
`src/services/domain/roadmap.service.ts`, so every capability speaks the
same lifecycle: `status`, `list`, `get`, `create`, `update`, `remove`,
`execute`, `analytics`, `health`, `live`, `history`, `settings`,
`updateSettings`.

## Services (v4)

- `brainV4Service`, `memoryV4Service`, `decisionV4Service`
- `agentsService`, `pluginsV4Service`, `skillsV4Service`,
  `developerV4Service`
- `cloudService`, `globalPlatformService`, `digitalTwinService`,
  `iotService`, `nativeService`
- `workflowV4Service`, `intelligenceV4Service`, `monitoringService`,
  `billingService`

## Server functions (v4)

`src/lib/`:
`brain-v4.functions.ts`, `memory-v4.functions.ts`,
`decision-v4.functions.ts`, `agents-v4.functions.ts`,
`plugins-v4.functions.ts`, `skills-v4.functions.ts`,
`developer-v4.functions.ts`, `cloud-v4.functions.ts`,
`global-v4.functions.ts`, `digital-twin-v4.functions.ts`,
`iot-v4.functions.ts`, `workflow-v4.functions.ts`,
`intelligence-v4.functions.ts`, `monitoring-v4.functions.ts`,
`billing-v4.functions.ts`. All auth-guarded via `requireSupabaseAuth`.

## Routes (v4)

New: `/cloud`, `/iot`, `/digital-twin`, `/agents`, `/native`, `/billing`,
`/monitoring`. Existing v3 surfaces reused: `/brain`, `/global`,
`/plugins`, `/skills`, `/developers`, `/runtime`, `/workflows`,
`/intelligence`, `/enterprise-cloud`.

## Security

Reuses v1/v2/v3 RBAC, permissions, RLS, audit, Supabase Auth and feature
flags. No new security architecture. Every server function goes through
`requireSupabaseAuth` and normalized error handling.

## Performance

Streaming, lazy loading, GPU rendering, virtualization, React Query
caching, memoization. Zero CLS target, 60 FPS motion.

## Accessibility

WCAG AA+ across new surfaces, keyboard-first navigation, ARIA labeling,
reduced-motion and high-contrast fallbacks.

## Digital Human

HAPPY speaks. Every v4 capability funnels through the Enterprise Brain,
never exposing multiple assistants.

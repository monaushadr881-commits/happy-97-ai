# HAPPY — Master APIs

## Server functions (`createServerFn`)

Total: **233** modules in `src/lib/*.functions.ts`. Pattern:

```ts
export const someFn = createServerFn({ method: "POST" })
  .inputValidator((d) => Schema.parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => { /* ... */ });
```

### Certified WORKING groups (R3 → R6)

| Module | Purpose |
|---|---|
| `founder-v2.functions.ts` | Founder dashboard counters, ops, security, deploy, queue, audit |
| `notification-center.functions.ts` | Inbox, mark read/unread, preferences, sample seed |
| `notification-center-v3.functions.ts` | v3 notification center legacy surface |
| `revenue-v1.functions.ts` | Overview (MRR/ARR), invoices list, payments list, timeseries |
| `financial-v1.functions.ts` | Plans, subscriptions, wallet ledger, credit ledger, founder overview |
| `digital-human-v1.functions.ts` | `dhSpeak` tool-loop, sessions, presentations |
| `happy-tools.server.ts` | HAPPY tool registry (server-only) |
| `api-v1.functions.ts`, `api-v2.functions.ts` | Public API surface + versioning |

### Broader surface (representative)

Agents/Runtime: `agents-v4`, `agent-runtime-v2`, `agents-v4`, `runtime-v3`, `runtime-engine-v3`, `workflow-{v2,v4}`, `workflow-runtime-v{2,3}`, `workflow-engine-v3`, `tool-runtime-v2`, `tool-engine-v3`, `tool-execution-v3`, `skills-{v2,v4}`, `skills-runtime-v3`, `plugin-v2`, `plugin-market-v2`, `plugin-runtime-v3`, `plugins-v4`, `collaboration-runtime-v3`, `collaboration-v{2,12,13}`, `capability-runtime-v3`, `dashboard-runtime-v3`, `dashboard-v2`, `decision-{v2,v4}`, `decision-runtime-v3`, `developer-{v2,v4}`, `developer-runtime-v3`, `planner-runtime-v3`, `planning-runtime-v3`.

Business/Enterprise: `business-v1`, `commerce-v7`, `customer360-v7`, `banking-v7`, `payments-v7`, `billing-{v4,v5}`, `partners-v15`, `organization-v15`, `workspace-{v5,v16}`, `productivity-v16`.

Cloud/DevOps: `cloud-{v4,v5}`, `deployment-{v1,v5}`, `connectors-v14`, `connectivity-v17`, `platform-v17`, `service-mesh-v17`, `data-fabric-v14`, `api-fabric-v17`, `telemetry-v11`, `compliance-v5`, `security-v2`, `permissions-v2`, `roles-v2`, `auth-v2`, `sessions-v2`.

Content/Community: `communication-{v6,v15}`, `communications-v16`, `broadcast-v3`, `announcement-v3`, `reminder-v3`, `search-{v12,v13,v16}`, `personalization-{v2,v4}`, `preferences-v3`, `template-v1`, `theme-v{1,2,4}`, `theme-marketplace`, `wallpaper-v1`, `appearance-v{2,4}`.

Creator/Studio/Builder: `creator-v1`, `builder-v1`, `website-builder-v1`, `app-builder-v1`, `white-label-v1`.

Domain verticals: `citizen-v8`, `smart-city-v8`, `transport-v8`, `utilities-v8`, `rural-v8`, `public-ai-v8`, `public-health-v9`, `telemedicine-v9`, `pharmacy-v9`, `patients-v9`, `appointments-v9`, `research-v9`, `wellness-v9`, `research-v15`, `digital-factory-v10`, `manufacturing (via business-v1)`, `warehouse-v10`, `assets-v10`, `quality-v10`, `supplychain-v{7,10}`, `devices-v11`, `robotics-v11`, `vision-v11`, `streaming-v11`, `super-intelligence-v12`, `unified-os-v12`, `simulation-v6`, `prediction-v6`, `autonomous-v11`, `universal-v13`, `automation-{v6,network-v13}`, `automation-runtime-v3`.

AI/Brain: `brain-{v3,v4}`, `financial-ai-v7`, `orchestration-{v12,v16}`, `communications-v16`, `happyx-chat`.

Gamification: `achievement-v5`, `streak-v5`, `coach-v5`, `widget-v5`.

Notifications legacy: `notifications-v3`, `notification-analytics-v3`.

Analytics: `analytics-v{5,7}`.

Utilities/Ops: `sustainability-v15`, `workforce-v6`, `roles-v2`, `permissions-v2`, `users-v2`.

## Public HTTP routes

Under `src/routes/api/`:

| Route | Auth | Purpose |
|---|---|---|
| `/api/dh.tts` | Session-scoped | Digital Human TTS synthesis |
| `/api/robots.txt` | Public | SEO |
| `/api/sitemap.xml` | Public | SEO |
| `/api/public/v1/*` | Public prefix (bypasses auth) | External callers — signature/secret MUST be verified in handler |

## Middleware

- `src/start.ts` `requestMiddleware`: security headers (CSP-RO, HSTS, nosniff, Referrer, Permissions, XFO/COOP)
- `src/start.ts` `functionMiddleware`: bearer attacher (`attachSupabaseAuth`) — required for any `requireSupabaseAuth` server fn

## HAPPY tools (LLM-callable)

Registered in `src/lib/happy-tools.server.ts`. Exposed to `dhSpeak` tool loop:

`platform_overview`, `platform_health`, `queue_stats`, `deployment_stats`, `security_summary`, `unread_notifications_count`, `list_notifications`, `mark_all_notifications_read`, `open_route`.

All execute under caller RLS. `open_route` and mutation tools return `client_actions` executed by the `/digital-human` page.

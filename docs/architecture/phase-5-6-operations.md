# HAPPY X — Phase 5.6: Enterprise Platform Operations

Operational backbone. **Founder Dashboard (Phase 6) must consume these
services; it may never implement operational logic itself.**

## Layers

```
Ops Consumers (Founder Dashboard, Status Page, external monitors)
   ↓  api server functions (src/lib/ops-v1.functions.ts)
Ops Services (src/ops/*.service.ts)
   ↓
Ops Tables + core Supabase (RLS scoped to ops-admins)
```

`is_ops_admin(user)` returns true for platform founders or holders of
`platform.manage`. RLS on every ops table gates access through this helper.

## Schema (7 tables)

| Table | Purpose |
|---|---|
| `health_checks` | Rolling per-service probe history. |
| `alert_rules` | Named alerting rules (severity, channels, condition). |
| `incidents` | Lifecycle-tracked incidents with root cause. |
| `incident_events` | Timeline entries per incident. |
| `deployments` | Release history (channel, strategy, status, notes). |
| `metrics_events` | Append-only structured metric stream. |
| `cron_runs` | Scheduled-job execution log. |

Enums: `health_status`, `alert_severity`, `incident_status`,
`deployment_status`, `deployment_strategy`.

## Ops Services (9)

| Service | Concerns |
|---|---|
| `healthService` | Probes for database / queue / AI gateway / cache / search / webhooks + `record()` persistence. |
| `metricsService` | Emit + range-aggregate metric events. |
| `alertingService` | CRUD alert rules + `trip()` opens an incident. |
| `incidentService` | Open, transition, add event, timeline. |
| `deploymentService` | Start / finish, list, aggregate analytics. |
| `queueOpsService` | Queue stats, DLQ, retry, cron-run recording. |
| `securityOpsService` | 24h audit summary + severity-filtered feed. |
| `aiOpsService` | Cost / tokens / latency rollup per model. |
| `dbOpsService` | Table-count schema-size snapshot. |

## API Surface (`src/lib/ops-v1.functions.ts`)

22 server functions namespaced `ops*`. All require `requireSupabaseAuth`
and are further gated by RLS to ops-admins:

```
opsHealthAll, opsHealthRecord
opsMetricsEmit, opsMetricsRange
opsListAlertRules, opsUpsertAlertRule, opsTripAlert
opsListIncidents, opsOpenIncident, opsTransitionIncident, opsIncidentTimeline
opsListDeployments, opsStartDeployment, opsFinishDeployment, opsDeploymentAnalytics
opsQueueStats, opsQueueFailed, opsQueueRetry
opsSecuritySummary, opsSecurityAudit
opsAiUsage
opsDbSchemaCounts
```

Public HTTP: `/api/public/v1/health` (Phase 5) and `/api/public/v1/status`
(this phase) — compact JSON snapshots for external uptime monitors.

## Observability

- **Distributed logging** — every service call routes through
  `defineService()` in `@/services/core`, emitting structured JSON with
  `traceId`, `service`, `action`, `durationMs`, `userId`, `companyId`,
  and (on failure) `code` and `message`.
- **Distributed tracing** — each ServiceContext carries a `traceId`;
  propagate via `metricsService.emit({ labels: { traceId } })` to
  correlate metrics with logs.
- **Metrics** — append `metrics_events` (service, metric, value, unit,
  labels). Read via `metricsService.range`.
- **Health checks** — six built-in probes; extend by adding a method to
  `healthService`. Persist via `healthService.record` for trending.

## Monitoring & Alerting

- Real-time status: `opsHealthAll` + `opsQueueStats` + `opsAiUsage` +
  `opsSecuritySummary` are the four calls the founder status page will
  fan out to.
- Alert rules live in `alert_rules`; a trip opens an incident with
  severity and creates a timeline entry.
- Incident lifecycle: `open → investigating → identified → monitoring →
  resolved` — enforced by the `incident_status` enum.
- Notification routing plugs into `channels` on the rule (email / slack /
  webhook connectors), driven by `notificationService` from Phase 5.

## DevOps

- Environments modelled via `deployments.channel` (`development` /
  `testing` / `staging` / `production`).
- Deployment strategies: `rolling` / `blue_green` / `canary` / `hotfix`.
- Rollback = record a new `deployments` row with `status='rolled_back'`;
  `analytics()` surfaces success/failure/rollback rates.
- Config & secrets managed by Lovable Cloud secrets (`SUPABASE_*`,
  `LOVABLE_API_KEY`); feature flags via Phase 5 `featureFlagService`.

## Queue System

Phase 5 `jobsService.enqueue` produces; ops-side inspection lives here
(`queueOpsService`). Statuses: `ready`, `running`, `succeeded`, `failed`,
`dead` (DLQ). Retries reset `status='ready'` and clear `last_error`.
`cron_runs` records each scheduled job (durations, message).

## AI Operations

`aiOpsService.usage(hours)` aggregates from `ai_sessions`:
totals + per-model calls / tokens / credits / avg latency. Model or
provider health probed by `healthService.aiGateway`.

## Database Operations

`dbOpsService.schemaCounts` returns cardinality for the hot tables
(auditable growth signal). Migration history + slow-query surface belong
to the platform tools (Lovable Cloud) and are documented in the Runbook,
not re-implemented in-app.

## Security Operations

- `securityOpsService.summary` — critical/warning/auth events (24h).
- `securityOpsService.recentAudit` — filterable audit feed.
- Underlying `audit_logs` are immutable (Phase 2 trigger).

## Quality (baseline)

- Type-checked (`tsgo`): green.
- Zod validation at every service boundary.
- RLS on every ops table; helper `is_ops_admin` restricted appropriately.

## Runbook (quick)

**Symptom → First call**

- App is slow → `opsHealthAll` + `opsAiUsage({hours:1})` + `opsQueueStats`.
- Users report failed writes → `opsSecuritySummary` + `opsHealthAll` (DB probe).
- Jobs backing up → `opsQueueFailed` → `opsQueueRetry({id})` or `opsTripAlert`.
- Bad release → `opsListDeployments({channel:'production'})` →
  `opsStartDeployment({strategy:'hotfix',...})` or record `rolled_back`.

**Incident response**

1. `opsOpenIncident({title,service,severity})`.
2. Add events via `opsTransitionIncident` for each status transition.
3. Once fixed: transition to `resolved`; audit trail is preserved by
   `incident_events`.

## Rule for Phase 6

Founder Dashboard imports **only** `@/lib/ops-v1.functions.ts` for
operational reads/writes. No SQL, no direct Supabase queries, no bespoke
health checks in UI code.

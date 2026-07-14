# Phase 6 — Founder Command Center

The Executive Operating System for HAPPY PERSON PRIVATE LIMITED.
Sole authority interface; consumes only `api-v1` and `ops-v1` server
functions — never touches the database directly.

## Route Tree

```
/founder                        Layout — subnav + Cmd+K palette
├── /                           Executive Overview
├── /companies                  Company & brand governance
├── /users                      Identity & access
├── /ai                         AI usage, cost, sessions
├── /ops                        Health, incidents, deployments, queue
├── /security                   Threats, audit, sessions, keys
├── /analytics                  KPI trends (7-day windowed metrics)
└── /system                     Flags, integrations, languages, schema
```

## Widget Inventory

- `StatCard` — Users, Companies, Brands, Workspaces, AI Sessions,
  Conversations, Deployments, Queue Backlog, Failed Jobs, Cost,
  Requests, Tokens, Active Sessions, Failed Logins, API Keys,
  Webhook Deliveries, Signups, Orders, API Calls.
- `Panel` — Health probes, Security summary, Recent Activity, Model
  mix bars, Deployment history, Incidents, Failed jobs, Flags,
  Integrations, Languages, Schema stats, 7-day trend bars.
- `CommandPalette` — Cmd/Ctrl+K global palette (navigate, companies,
  knowledge search).
- `FounderNav` — sticky glass tab bar.

## KPI Inventory

`platformService.overview` → users, companies, brands, workspaces,
ai_sessions, conversations. `opsQueueStats` → pending, running, failed,
done. `opsDeploymentAnalytics` → total, success_rate.
`opsSecuritySummary` → active_sessions, failed_logins_24h, api_keys,
webhook_deliveries_24h. `opsAiUsage` → requests, tokens, cost_usd,
by_model[]. `opsMetricsRange` → arbitrary metric buckets.

## Permission Matrix

| Surface                | Read                    | Write                     |
|------------------------|-------------------------|---------------------------|
| Overview / Analytics   | authenticated           | —                         |
| Companies              | company member          | founder / `platform.manage` |
| Brands                 | company member          | company admin             |
| Users / Access log     | founder (self-scope)    | —                         |
| AI Console             | authenticated           | —                         |
| Operations             | RLS `is_ops_admin`      | RLS `is_ops_admin`        |
| Security               | RLS `is_ops_admin`      | —                         |
| System                 | authenticated           | founder / `platform.manage` |

All enforcement lives in the service layer + RLS; UI only reflects state.

## Realtime

`useQuery` refetch intervals — 15s (queue), 20s (health), 30s (overview,
security). Command palette lazy-queries companies + knowledge on open.

## Security

- Route sits under `_authenticated` — anonymous users redirect to `/auth`.
- Every ops mutation (retry, transition, deploy) proxies through
  `requireSupabaseAuth` middleware; RLS enforces founder-only writes.
- No secrets or tokens reach the client bundle.
- Cmd+K search only surfaces entities the caller is allowed to read.

## Performance

- Layout code-split via TanStack automatic split.
- Queries scoped with fine `queryKey`s to enable cache reuse across tabs.
- Bar charts render as CSS-only divs — no chart lib payload on the
  founder path.
- Sticky subnav uses `backdrop-blur` on the same layer as the app header.

## Accessibility

- All chips carry semantic tone + text, never colour alone.
- Command palette powered by shadcn `cmdk`, full keyboard nav.
- Kbd hints (`⌘ K`) exposed in the overview header.
- Focus rings inherited from design-system tokens (`--ring: gold`).

## Testing

Manual smoke path:
1. Sign in as a Founder, navigate `/founder` — overview renders with
   live probes.
2. Press ⌘K — palette opens, typing filters companies + knowledge.
3. Companies → create, then create a brand under it.
4. Ops → retry a failed job (toast + list refresh).
5. Analytics → 7-day bars render (empty state for un-emitted metrics).

## Governance rule (permanent)

No page under `/founder` may query Supabase directly, define business
logic, or introduce styling outside `@/design-system`. All new founder
surfaces must plug into `FounderNav`, `CommandPalette`, and consume the
service layer via `api-v1` / `ops-v1`.

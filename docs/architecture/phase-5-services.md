# HAPPY X — Phase 5: Enterprise Service Layer & API Architecture v1.0

Permanent backend architecture. **No module may bypass the service layer.**

## Layers

```
UI (routes / components)
  ↓  useServerFn / loaders
Server Functions   (src/lib/api-v1.functions.ts)   ← ONLY surface UI can call
  ↓
Application Services  (src/services/domain/*.service.ts)
  ↓
Repositories  (src/enterprise/repositories.server.ts)
  ↓
Supabase (RLS as caller)  →  Postgres  →  Infrastructure
```

Rules:
- UI **never** imports repositories or the Supabase client for data ops.
- Server functions are thin adapters — validation, `ServiceContext` build,
  delegate, translate errors. No business logic here.
- Services are stateless factories. They receive `ServiceContext`
  (Supabase client, userId, tenant, trace, cache) and return typed DTOs.
- Repositories own SQL/PostgREST specifics.

## Core Infrastructure (`src/services/core`)

| File | Purpose |
|---|---|
| `result.ts` | `Result<T, E>`, `ok`, `err`, `unwrap`. |
| `errors.ts` | `AppError`, `ERROR_CODES`, HTTP status map, localized messages. |
| `logger.ts` | Structured `slog` with `traceId`/`requestId`. |
| `context.ts` | `ServiceContext` factory. |
| `cache.ts` | `Cache` interface + in-memory backend (Redis-ready). |
| `validation.ts` | `validate(schema, input)` + shared Zod primitives. |
| `pagination.ts` | Cursor encode/decode + `Page<T>`. |
| `service.ts` | `defineService()` wrapper — timing, logging, error normalization. |
| `rate-limit.ts` | Token-bucket per user+action. |

## Middleware (`src/services/middleware.ts`)

- `withServiceContext` — attaches `svc: ServiceContext` for downstream.
- `requirePermission(code, scope, scopeId)` — RPC-backed authorization.
- `rateLimit(action, { capacity, refillPerSec })` — per-user throttling.
- `auditRequest` — boundary request logging.

## Services (17)

| Service | Concerns |
|---|---|
| `platformService` | Health, founder detection. |
| `authzService` | `hasPermission`, `isCompanyAdmin`, `isCompanyMember`. |
| `companyService` | List/get/create companies. |
| `brandService` | Brand CRUD scoped to company. |
| `workspaceService` | Workspace CRUD, membership lookups. |
| `userService` | Profile + preferences. |
| `settingsService` | Hierarchical setting resolution. |
| `notificationService` | List / send / mark-read. |
| `auditService` | Immutable audit log reads + writes. |
| `aiService` | Central AI orchestration (chat + embeddings). |
| `conversationService` | Chat threads; delegates to `aiService`. |
| `searchService` | Universal search (knowledge, companies). |
| `analyticsService` | Executive metrics + activity feed. |
| `featureFlagService` | Runtime toggles. |
| `localizationService` | Languages / countries / currencies. |
| `integrationService` | Integrations + webhooks catalog. |
| `jobsService` | Enqueue / status for `job_queue`. |

## API v1 (`src/lib/api-v1.functions.ts`)

Every UI-facing operation ships as an `api*` server function. Naming:
`api<Verb><Resource>`, e.g. `apiListCompanies`, `apiSendMessage`,
`apiPlatformOverview`.

**Versioning:** the file itself is v1. Breaking changes ship as
`src/lib/api-v2.functions.ts` (new exports, old preserved). Clients pin
imports by version.

**Public HTTP:** `src/routes/api/public/v1/health.ts` returns service
metadata for external monitors (no auth, per platform convention).

## Validation

Zod at every boundary via `validate()`. Shared primitives in
`src/services/core/validation.ts` (`V.uuid`, `V.slug`, `V.page`, …).
Environment secrets are read **inside handlers**, never at module scope.

## Error Handling

`AppError` carries `code` (stable identifier), `message` (user text),
`developerMessage`, `status`, `meta`. Every service is wrapped by
`defineService()` which normalizes throws through `toAppError`.

Error catalog:

| Code | Status | Meaning |
|---|---|---|
| `AUTH.UNAUTHORIZED` | 401 | Not signed in |
| `AUTH.FORBIDDEN` | 403 | Missing permission |
| `VALIDATION.FAILED` | 400 | Zod validation error |
| `RESOURCE.NOT_FOUND` | 404 | Entity missing |
| `RESOURCE.CONFLICT` | 409 | State conflict |
| `TENANCY.MISMATCH` | 403 | Cross-tenant access |
| `INFRA.RATE_LIMITED` | 429 | Rate-limit tripped |
| `INFRA.DB_ERROR` | 500 | DB failure |
| `AI.UNAVAILABLE` | 503 | AI gateway down |
| `AI.CREDITS_EXHAUSTED` | 402 | Out of AI credits |

## Logging

Structured via `slog`. Every service call emits `service.ok` / `service.err`
with `service`, `action`, `traceId`, `userId`, `companyId`, `durationMs`,
and (on error) `code`, `message`. Trace IDs are generated per context.

## Cache

`ctx.cache.wrap(key, ttlMs, loader)` is the standard pattern. The current
backend is in-memory; the interface is Redis/KV compatible.

## Rate Limiting

`checkRateLimit(key, { capacity, refillPerSec })` on hot endpoints (e.g.
AI calls). Compose via the `rateLimit()` middleware factory.

## Search

`searchService.knowledge` uses Postgres websearch over
`knowledge_articles.search_vector` (GIN indexed in Phase 4).
`searchService.companies` uses trigram ilike. Semantic/vector search will
plug in via `aiService.embed` + pgvector when needed — no new API shape
required.

## Background Jobs

`jobsService.enqueue({ kind, payload, run_at?, max_attempts? })` writes to
`job_queue`. Future workers pull `status='ready' AND run_at <= now()`,
increment attempts, and move to DLQ after max attempts.

## AI Orchestration

`aiService.chat({ system, messages, model? })` is the ONLY path to the
gateway. `conversationService.send` builds history from Postgres, calls
`aiService`, persists the assistant reply, and returns `{ conversationId, reply, model }`.
Prompts, models, and providers live behind this seam.

## Security

- Every mutating server function requires `requireSupabaseAuth`.
- `requirePermission()` middleware for admin-scoped operations.
- Tenant isolation enforced by RLS + defense-in-depth checks in services.
- Public HTTP endpoints live under `/api/public/*` and MUST validate
  signatures for webhooks (see Phase 4 conventions).
- Secrets read inside handlers only.

## Performance

- Cursor pagination helpers ready.
- Per-request in-memory cache (permissions, feature flags).
- Batch operations use `Promise.all` and `count: exact, head: true` for
  counters.

## Developer Guide (quick)

Add a new operation:
1. Add method to a domain service under `src/services/domain/*`.
2. Export via `src/services/index.ts` if new service file.
3. Add an `api*` server function in `src/lib/api-v1.functions.ts`.
4. Call from UI via `useServerFn(apiThing)`.

# Production Deployment

## Domain / SSL / DNS
Managed by Lovable hosting. Custom domains: add via project settings,
DNS records issued automatically, SSL auto-provisioned.

## CDN / caching / compression
Managed by Lovable hosting edge. Static assets are hashed and cache-forever.
SSR HTML uses revalidation cache headers.

## Headers
See `docs/security/security-hardening.md`.

## Monitoring
- Server-function logs via `stack_modern--server-function-logs`
- Edge-function logs via `supabase--edge_function_logs`
- Runtime errors via the runtime-errors knowledge feed
- Health-check aggregator: `/production/dashboard`

## Rollback
Publish history in the Lovable dashboard allows one-click rollback to any
previous published build.

## Zero-downtime
Rolling deploys via the release runtime (R64). Blue/green not applicable
on the managed edge — atomic swap of the published bundle.

## Backups
Supabase managed daily backups (7-day retention on Free, 30-day on paid
plans). Recovery via project settings. Storage buckets snapshotted with
the DB.

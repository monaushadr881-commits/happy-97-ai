# HAPPY — MASTER SECURITY POLICY

**Version:** 1.0 · Binding for every module in the HAPPY platform.

## 1. Trust Model

- **Browser** — untrusted. Publishable key only. RLS enforced.
- **Server function** — trusted after `requireSupabaseAuth`. Runs as
  the caller; RLS still applies.
- **`supabaseAdmin`** — highest trust; bypasses RLS. Reserved for
  verified webhooks and admin/maintenance code. Never reachable from
  a client-imported module graph.

## 2. Row-Level Security (mandatory)

Every table in `public` MUST:

1. Have `ENABLE ROW LEVEL SECURITY`.
2. Have explicit `GRANT` statements in the same migration.
3. Have at least one `POLICY` per role that needs access.
4. Never grant `anon` unless the table is genuinely public.
5. Always grant `service_role` for tables used by webhooks/admin code.

Migrations without GRANT are rejected.

## 3. Roles

- Roles live in `public.user_roles` (separate table).
- Never store roles on `profiles` or the `users` table.
- Role checks use the `public.has_role(uuid, app_role)` security-definer
  function inside RLS policies.
- Client-side role checks are UI hints only, never security boundaries.

## 4. Secrets

- Server-only env vars read inside `.handler()`, never at module scope
  in files that ship to the client.
- `SUPABASE_SERVICE_ROLE_KEY` and DB password are not available on
  Lovable Cloud — never fabricate placeholders.
- User-provided secrets are stored via the platform's secret manager,
  never committed to the repo.

## 5. Public API (`/api/public/*`)

- Bypasses auth on published sites.
- Every handler MUST verify caller identity: HMAC signature, shared
  secret, or scoped bearer token.
- Never return PII beyond what the caller already owns.
- Rate limit at the edge before doing DB work.

## 6. Webhooks

- Verify signature with a constant-time compare (`timingSafeEqual`).
- Reject replays via idempotency key + timestamp window.
- Log every accepted event to `webhook_events` (append-only).

## 7. Audit Logging

- Financial mutations (subscription events, ledger entries) are
  append-only via database triggers that block `UPDATE`/`DELETE`.
- Founder and admin actions log to `audit_events` with actor, target,
  before/after where meaningful.

## 8. Auth

- Email/password + configured social providers only.
- No anonymous sign-ups.
- Never auto-confirm email unless explicitly requested by the Founder.
- OAuth `redirect_uri` MUST be a full same-origin public URL; never
  point directly at protected routes.

## 9. Headers (applied in `src/start.ts`)

- CSP-Report-Only (tightening in progress)
- HSTS
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: restrictive default
- X-Frame-Options: DENY
- Cross-Origin-Opener-Policy: same-origin

## 10. Data Retention

- Ledgers: retained indefinitely (immutable).
- Notifications: user-controlled, default 180 days.
- Audit events: 24 months minimum.
- Session/refresh tokens: managed by Supabase Auth defaults.

## 11. Incident Response

- Any suspected RLS bypass, key leak, or unauthorized access is a P0.
- Rotate keys, revoke sessions, notify Founder within the same session.
- Add a regression test and a note in `MASTER_AUDITS.md`.

## 12. Prohibited

- Storing plaintext secrets in the DB.
- Using `supabaseAdmin` for ordinary reads.
- Returning JWTs, service keys, or DB passwords in any response.
- Logging secrets, tokens, or full request bodies containing PII.

# Security Hardening

## Baseline (already enforced)
- Supabase auth for every non-`/api/public/*` route
- RLS on every public-schema table
- `has_role` security-definer gate for role checks
- Service-role client only inside authorized `.server.ts` handlers
- Webhook routes verify signatures with `timingSafeEqual`

## R74 additions (surface only)
- Security audit aggregator (`security-audit.functions.ts`) returns a
  read-only report: RLS coverage %, tables missing GRANTs, public
  endpoints without signature check, secrets required-but-missing.
- No new secrets, no new endpoints, no relaxation of existing policies.

## Headers (documented for hosting layer)
`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Content-Security-Policy` (report-only until baseline confirmed),
`Permissions-Policy` (camera=(), microphone=(), geolocation=() by default;
opt-in per route).

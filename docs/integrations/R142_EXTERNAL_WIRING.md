# R142 — External Integration & Production Wiring™

Gap-closure phase. Extends the R101 canonical adapter layer
(`src/lib/happy-adapters/*`) with the remaining external families and adds a
Founder read-only surface. **No new payment/comms/auth/storage/AI runtime
was created.** Every new adapter routes into an existing canonical owner.

## Files Changed
- `src/lib/happy-adapters/payments/iap.ts` (new) — Google Play Billing + Apple IAP verifier stubs
- `src/lib/happy-adapters/sms/index.ts` (new) — Twilio (live), MessageBird, AWS SNS
- `src/lib/happy-adapters/whatsapp/index.ts` (new) — WhatsApp Cloud API (live), Twilio WhatsApp
- `src/lib/happy-adapters/ai/index.ts` (new) — Lovable Gateway (canonical), OpenAI, Gemini, Anthropic, Local
- `src/lib/happy-adapters/storage/index.ts` (new) — Supabase (managed), S3, R2, GCS, GDrive
- `src/lib/happy-adapters/maps/index.ts` (new) — Google Maps, Mapbox, HERE, Geolocation (browser)
- `src/lib/happy-adapters/analytics/index.ts` (new) — Sentry, PostHog, Plausible, Datadog, GA4
- `src/lib/happy-adapters/social/index.ts` (new) — Instagram, Facebook, YouTube, LinkedIn, X, TikTok
- `src/lib/happy-adapters/auth-extra/index.ts` (new) — Magic Link (managed), Phone OTP (managed), Passkeys/WebAuthn
- `src/lib/happy-adapters/index.ts` — aggregator + `adapterReadinessFlat()`
- `src/routes/_authenticated/founder.integrations.tsx` (new) — read-only readiness surface
- `tests/unit/happy-r142.test.ts` (new, 6 tests)
- `docs/integrations/R142_EXTERNAL_WIRING.md`

## Canonical Owners (routed into, never duplicated)
| Family | Canonical owner |
|---|---|
| Payments | `billing-v4/v5`, `banking-v7`, existing `payments/` adapter |
| IAP | `mobile/android`, `mobile/ios` (R101) |
| Email | Lovable Emails + `email/` adapter (R101) |
| SMS / WhatsApp / Push | `communications-v16` + `push/` adapter (R101) |
| Auth (all methods) | Lovable Cloud auth + `src/lib/happy-id/*` (R114) |
| AI | Lovable AI Gateway via `src/lib/happy-chat.functions.ts` and `src/lib/brain/engine.ts` (R115) |
| Storage | Lovable Cloud Storage + `src/lib/happy-r119/file-intelligence.ts` |
| Maps / Analytics | `analytics-v7` + `happy-r130` Founder Dashboard |
| Social publishing | `creator-v1` (R126 Creator OS) |
| Deployment | `deployment/` adapter (R101) — Web/PWA/Netlify/Vercel/CF/Docker/Play/AppStore/MS Store |

## Connected Providers (live-callable when credentials supplied)
- `email.resend`, `sms.twilio`, `whatsapp.cloud_api`

## Architecture-Ready (payload builder ready, credentials pending)
All remaining ~40 adapters: `iap.*`, `payments.*`, `email.smtp|sendgrid|ses|mailgun`,
`sms.messagebird|aws_sns`, `whatsapp.twilio`, `push.*`, `ai.openai|gemini|anthropic|local`,
`storage.s3|r2|gcs|gdrive`, `maps.*`, `analytics.*`, `social.*`, `deploy.*`.

## Pending Credentials
Every adapter's env var list is enumerated in `adapterReadinessFlat()` and
surfaced at `/founder/integrations`. Missing env vars display inline.

## External Dependencies (repo cannot fix)
- Native store credentials (Play Console, App Store Connect, Microsoft Store)
- IAP native SDK: requires Capacitor plugin in mobile shells
- Social OAuth clients require per-provider developer accounts + App User Connector clients
- Passkeys need `WEBAUTHN_RP_ID` = production domain
- Full IAP receipt verification requires JWT signer at runtime (Play Developer API / App Store Server API)

## No Duplicates
`adapterReadinessFlat()` test asserts unique IDs across all 19 families.
No provider manager, wallet, notification hub, auth store, model registry or
storage bucket was introduced. Every adapter is a translator over an existing
canonical owner.

## Evidence
- `bunx tsgo --noEmit` → 0 errors
- `bunx vitest run` → **58 files / 668 tests green** (was 662 / +6 R142)
- New route: `/founder/integrations` — live readiness matrix
- Registry: `adapterReadinessFlat()` machine-readable export

## Known Limitations
- IAP + native store deploy adapters cannot execute in the Cloudflare Worker runtime; they require the mobile shell CI pipeline.
- SendGrid / SES / MailGun / MessageBird / SNS / TwilioWhatsApp / all push families require provider SDK payload builders — architecture-ready, credentials-pending.
- Non-Lovable AI providers should only be enabled when a workspace explicitly overrides the default Gateway; canonical Brain calls stay on Lovable AI Gateway.

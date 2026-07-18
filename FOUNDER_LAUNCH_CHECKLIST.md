# FOUNDER_LAUNCH_CHECKLIST.md — R148 Launch Preparation

**Verdict:** 🟡 **NO-GO for public launch** until the blockers below are cleared.
**Repo state:** ✅ READY (698/698 tests, R146 hardening + R147 audit passed).
**Blockers:** all are external configuration — no code work required.

---

## 1. External Providers

Legend: 🟢 CONNECTED · 🟡 CONFIGURATION REQUIRED · 🔴 BLOCKED

| Provider | Status | Resolution |
|---|---|---|
| Lovable AI Gateway | 🟢 CONNECTED | `LOVABLE_API_KEY` managed secret present. |
| Cron shared secret | 🟢 CONNECTED | `CRON_SHARED_SECRET` set (R104 hardening). |
| Google Search Console | 🟢 CONNECTED (workspace) | Available connector, not linked to project — link only if SEO reporting is needed in-app. |
| **Stripe (Payments)** | 🟡 | Run `enable_stripe_payments` (built-in, no key needed). Do NOT use BYOK unless the founder insists. |
| **Razorpay (Payments IN)** | 🟡 | Adapter shipped (`happy-adapters/payments/razorpay`). Add `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` + webhook secret via `add_secret`. |
| **Twilio (SMS)** | 🟡 | Connect via `standard_connectors--connect` (connector_id `twilio`). Enable SMS Pumping Protection + Geo Permissions before live traffic. |
| **WhatsApp Business** | 🟡 | Connect Sinch/Twilio WhatsApp connector; complete Meta business verification (external, ~1–3 weeks). |
| **Google OAuth** | 🟡 | Call `supabase--configure_social_auth` with `providers:["google"]`. Managed broker — no client id needed. |
| **Apple OAuth** | 🟡 | Managed default works; BYOC requires Services ID + .p8 key + Team ID (Apple Developer, $99/yr). |
| **Email (Lovable Emails)** | 🔴 | **No email domain configured.** User must run email setup dialog and add a domain they own. Until then app-emails cannot send; auth emails fall back to default Lovable sender. |
| **Push (FCM / APNs)** | 🟡 | Adapter shipped. Requires FCM server key (Android) + APNs .p8 (iOS) after native app is built. |
| **Analytics** | 🟡 | Adapter shipped. Add provider key (PostHog / Plausible / GA4) via `add_secret` OR skip for launch. |
| **Maps** | 🟡 | Adapter shipped. Add `MAPBOX_TOKEN` or Google Maps key only if a map surface ships in v1. |
| **Storage** | 🟢 CONNECTED | Lovable Cloud Storage (Supabase) available; no extra config for MVP. External S3/R2 optional. |
| Live2D / MetaHuman / ACE / Vision Pro | 🔴 EXTERNAL BLOCKED | Locked out of scope per R91. VRM shipped as canonical DH. |
| Native store credentials (App Store / Play Store) | 🔴 EXTERNAL BLOCKED | Required only when publishing native apps. |

---

## 2. Infrastructure

| Item | Status | Notes |
|---|---|---|
| Environment variables | 🟡 | Only `LOVABLE_API_KEY` + `CRON_SHARED_SECRET` set. Add provider secrets as each 🟡 above is unblocked. |
| Production domain | 🔴 | Project **not published**. Run `preview_ui--publish` when ready → allocates `*.lovable.app`. |
| HTTPS / SSL | 🟢 | Auto-provisioned by Lovable on publish and on custom domains. |
| Custom domain | 🟡 | Optional. Connect in Project Settings → Domains after first publish. |
| DNS | 🟡 | Only needed for custom domain + email domain. |
| Production database | 🟢 | Lovable Cloud (Supabase) live, 64 migrations applied, RLS + GRANTs verified in R146. |
| Object storage | 🟢 | Lovable Cloud storage available. |
| Backups | 🟢 | Lovable Cloud manages daily backups; `bkp_*` module registry present for app-level snapshots. |
| Monitoring | 🟢 | `obs_*` tables + R144 perf helpers + Cloud → Logs. |
| Error reporting | 🟢 | `src/lib/error-capture.ts` + `incidents` table. External Sentry optional. |
| Analytics | 🟡 | See providers table. |

---

## 3. Deployment Readiness by Surface

| Surface | Status | Blocker |
|---|---|---|
| **Web** | 🟢 READY | TanStack Start builds green, 500 routes, budgets met. Publish when ready. |
| **PWA** | 🟢 READY | Service worker + manifest present. |
| **Android (native)** | 🟡 | Requires Capacitor build + Play Store credentials (external). |
| **iOS (native)** | 🟡 | Requires Capacitor build + App Store Connect + Apple Developer account (external). |
| **Desktop** | 🟡 | Adapter present (`happy-adapters/desktop`); packaging (Tauri/Electron) is external work. |

---

## 4. Launch Checklist

- [x] **Security** — R146: RLS, GRANTs, cron auth, TTS rate-limit, PostgREST sanitization, audit immutability.
- [x] **Performance** — R144 budgets (LCP 2.5s / INP 100ms / JS 220KB) wired.
- [x] **Monitoring** — obs tables, incidents, health checks.
- [x] **Backups** — Lovable Cloud daily + app-level snapshot tables.
- [x] **Rollback** — `release_rollbacks` + `release_rollouts` tables and R145 archive path.
- [ ] **Legal — Privacy Policy** page (author before public launch; GDPR/CCPA required).
- [ ] **Legal — Terms of Service** page.
- [ ] **Legal — Cookie / Consent banner** (EU traffic).
- [ ] **Support** — Support inbox / help email routed to a real address.
- [ ] **Help Center** — `knowledge_articles` tables ready; seed initial articles.
- [ ] **Brand Assets** — logo, favicon, social OG image (per-route og:image on hero routes).
- [ ] **Store Assets** — icons, screenshots, descriptions (only if shipping native).
- [x] **SEO** — Per-route `head()` metadata, semantic HTML, sitemap-ready.
- [ ] **Analytics** — pick a provider (PostHog recommended) or ship without.
- [ ] **First Publish** — `preview_ui--publish` to allocate the `.lovable.app` URL.
- [ ] **Email domain** — set up sender domain (blocks transactional email).

---

## 5. Blockers (must clear before public launch)

| # | Blocker | How to resolve |
|---|---|---|
| **B1** | Project not published | Ask founder for approval, then run `preview_ui--publish`. |
| **B2** | No email domain configured | Open email setup dialog: `<presentation-open-email-setup>Set up email domain</presentation-open-email-setup>`. Founder must own the domain. |
| **B3** | Google OAuth provider not enabled | Run `supabase--configure_social_auth` with `providers:["google"]`. |
| **B4** | No Privacy Policy / Terms pages | Author `/privacy` and `/terms` routes (~1 hour) before collecting user data publicly. |
| **B5** | No payment provider live | Run `enable_stripe_payments` (or `enable_paddle_payments`) — only if v1 monetises. |

Non-blocking (post-launch OK): Razorpay, Twilio, WhatsApp, Push, Analytics, Maps, native store publishing.

---

## 6. Final Status

# 🟡 CONDITIONAL GO

- **Code / architecture / security / performance:** ✅ GO
- **External configuration:** 🔴 NO-GO until B1–B4 cleared (B5 only if charging on day 1)
- **Estimated time to GO:** ~2 hours of founder-approved configuration (mostly non-code).

Once B1–B4 are cleared, this project is production-launch ready.

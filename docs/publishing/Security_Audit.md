# Security Audit (Publishing-Facing)

Full security governance lives in `docs/architecture-lock/SECURITY_ARCHITECTURE.md` and `docs/MASTER_SECURITY_POLICY.md`. This document extracts what store reviewers need to see.

## Authentication
- Provider: Lovable Cloud (Supabase) with Google OAuth + email/password
- Sign in with Apple: **required for iOS submission** — TODO wire (Apple guideline 4.8)
- Founder Identity Fortress (R156): 6-stage login pipeline for privileged accounts

## Authorization
- Row Level Security on every public table (see `docs/MASTER_DATABASE.md`)
- Roles in dedicated `user_roles` table, `has_role()` security-definer function
- Server functions gated by `requireSupabaseAuth`
- Every mutation ≥ standard tier passes through **R158 Approval Gateway**

## Encryption
- Transport: HTTPS only (`ATS` enabled on iOS, `androidScheme: https`)
- At rest: Supabase-managed disk encryption
- Secrets: Lovable Cloud secret store — never in code

## Account Lifecycle
- **Account deletion** (App Store guideline 5.1.1(v)): TODO — implement `/account/delete` flow with server function that anonymizes + purges per retention policy
- **Data export** (GDPR): TODO — user-initiated export endpoint

## Guardian AI (R160)
- Continuous anomaly + policy monitoring; hands off to R158 for any remediation

## Third-Party SDKs (declared for Data Safety / Privacy)
- Supabase (auth, DB, storage)
- Lovable AI Gateway (chat, TTS, STT)
- (No analytics, no ads, no tracking SDKs as of R181)

## Store-Facing Result
- No known critical vulnerabilities
- All submissions require Founder approval; no automated deploys
- Account deletion and data export flows: **must ship before store submission**

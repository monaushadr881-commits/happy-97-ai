# Founder Decisions — R113 (Registry Companion)

This file extends `docs/FOUNDER_DECISIONS.md` — never replaces it. Append-only.

## R113 Decisions

- **502 Founder Modules** locked as permanent business architecture. See `FOUNDER_REGISTRY.md`.
- **Three-registry system** ratified: Founder (business), Technical (auto), Feature (bridge).
- **No merging** of registries; Founder Registry is never auto-generated.
- Registry status is v0 DRAFT until Founder ratifies each module row.
- Extension order R114–R130 established (Auth → Brain → Memory → DH → Workspace → Files → Search → Builders → CRM → ERP → HRMS → Marketplace → Creator → Comm → Revenue → Enterprise Control → Founder Dashboard).

## R151 Decisions — Future Platform Expansion (PENDING)

Permanent Founder Vision items. Architecture only; do not implement; reuse canonical owners; never remove.

- **Platforms (PENDING):** Windows, macOS, Linux, Apple Vision Pro.
- **Digital Human Engines (PENDING):** VRM (Primary, active), MetaHuman, Live2D, NVIDIA ACE.
- **XR (PENDING):** AR, VR, Mixed Reality.
- **Reuse rule:** All future renderers plug into the canonical Digital Human runtime (`HappyVRM` + `happy-runtime/digital-human.ts` adapters). All future platforms reuse the universal runtime shell. No duplicate Brain / Memory / Workspace / Conversation / Digital Human.
- Full record: `docs/founder/R151_FUTURE_PLATFORM_EXPANSION.md`.

## Historical (link)

See `docs/FOUNDER_DECISIONS.md` for prior decisions.


## R152 Decisions — Future Platform & Avatar Architecture (Architecture-Only)

Permanent Founder Vision. Extends R151. Never remove; never fork.

- **ONE Avatar Engine:** 16-method contract at `src/lib/happy-r152/avatar-engine.ts`. Every renderer implements it.
- **Renderers:** VRM (PRIMARY, active) · MetaHuman · Live2D · NVIDIA ACE (ARCHITECTURE READY) · Generic Plugin Slot.
- **Platforms:** Web (active) · Android · iOS (arch-ready) · Windows · macOS · Linux · Vision Pro · XR (pending). All reuse canonical Brain/Memory/Workspace/Conversation/Digital Human.
- **XR:** AR/VR/MR adapter contracts with spatial anchors, hand tracking, eye tracking, voice, environment mapping.
- **Bridges:** MetaHuman / NVIDIA ACE / Live2D — hook-only interfaces mapped onto the canonical AvatarEngine. No SDK imports.
- **Registry guards:** Runtime rejects duplicate registrations under an existing renderer id, platforms that fork a canonical owner, and asset id collisions with a different owner.
- Full record: `docs/R152_FUTURE_PLATFORM_ARCHITECTURE.md`.

## FD-153 — Founder Unlimited Privileges™ (R153)

**Date:** 2026-07-18 · **Status:** PERMANENT.

The Platform Founder (canonical `founder` role only) NEVER consumes Credits,
Subscription, Wallet, or any quota across: AI, Builder, Apps, Websites,
Companies, Workspaces, Storage, API, Automation, Brain, Memory, Search,
Digital Human, Conversation, Founder Dashboard, Creator Studio, Business OS,
Enterprise.

Enforced by the pure governance helper `src/lib/founder/unlimited-policy.ts`,
consumed by the existing canonical owners (Credits / Subscription / Wallet /
Revenue OS / Payment Runtime / Permissions). No new runtime, no V2 of billing
/ credits / subscription / wallet.

Hard scope exclusion: NEVER applies to Company Admin, Workspace Admin,
Enterprise Admin, Customer, Developer, Employee, Partner.

Full record: `docs/founder/R153_FOUNDER_UNLIMITED_PRIVILEGES.md`.

## FD-156 — Founder Identity Fortress™ (R156)

**Date:** 2026-07-18 · **Status:** PERMANENT.

The Platform Founder account is the highest-security identity on the
platform. R156 governs identity, MFA, recovery, session, and audit policy
via a pure helper (`src/lib/founder/identity-fortress.ts`) consumed by the
existing canonical Happy ID owners.

Locks:
- Founder role CANNOT be assigned, edited, deleted, or transferred from any
  UI. Only the Happy ID Founder-verified recovery flow may update Founder
  identity contacts.
- No new auth system, no duplicate OTP, no duplicate session store, no
  duplicate identity module.
- Every Founder action is written to `audit_logs` via `write_audit(...)`.

Full record: `docs/founder/R156_FOUNDER_IDENTITY_FORTRESS.md`.

## FD-157 — Founder Security Center (R157)
Extends R156 Identity Fortress with the full Security Center UI, WebAuthn
passkey CRUD on Happy ID, and an integration test that walks the entire
Password → OTP → Risk → Trusted Device → Passkey → Recovery → Emergency
pipeline. Zero new runtime. Zero duplicate auth/identity. One new
user-scoped table (`auth_passkeys`) that follows the exact pattern of
`auth_devices`. 737/737 tests green.

Full record: `docs/founder/R157_FOUNDER_SECURITY_CENTER.md`.

## FD-158 — Founder Approval Gateway (R158)
HAPPY may never execute a significant change without a full Explain → Preview →
Approve → Execute cycle. 17-stage pipeline, 4 tiers, 12-field explanation
contract, 5×2 preview matrix, compile-time auto-execute lock, mandatory
password+OTP for critical actions, rollback envelope required. Pure
governance helper — zero new runtime. Consumed by Brain, Memory, Workspace,
File Engine, Search, Creator, Revenue OS, Founder Dashboard, Security
Center, Audit, RBAC. All 11 tests green.

Full record: `docs/founder/R158_FOUNDER_APPROVAL_GATEWAY.md`.

## FD-159 — Founder Intent Engine (R159)
Founder speaks naturally in any of 11 modalities across 21 intent types.
HAPPY understands via an 8-field contract, asks clarifying questions when
any field is missing (never guesses), generates 9 thinking artifacts, runs
9 automatic checks (including duplicate-runtime/API/table), produces 6
plans, presents them via the R158 Explain contract, and hands off to R158
Approval Gateway. Pure governance helper — zero new runtime, extends
Brain/Memory/Conversation/Workspace/Search/Creator/Revenue/Approval. All 7
tests green.

Full record: `docs/founder/R159_FOUNDER_INTENT_ENGINE.md`.

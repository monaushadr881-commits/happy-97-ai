# HAPPY — MASTER CONSTITUTION

**Version:** 1.0 · **Owner:** Founder, H.P PRIVATE LIMITED · **Status:** PERMANENT

The permanent engineering constitution for the HAPPY Enterprise Platform.
Every implementation from this point forward must follow this document.

## 1. Authority

The Founder is the only authority that can approve:

- Architecture changes
- Database breaking changes
- Security policy changes
- Core business logic changes
- Digital Human identity changes
- Brand identity changes
- Revenue model changes
- Company structure changes

Everything else follows this Constitution and the master documentation set.

## 2. Source of Truth

The following documents are permanent and canonical. When they disagree,
the file with the higher-precedence rank wins.

| Rank | Document | Purpose |
|---|---|---|
| 1 | `MASTER_CONSTITUTION.md` | This file — governance authority |
| 2 | `MASTER_STATUS.md` | Honest shipping state |
| 3 | `MASTER_IMPLEMENTATION_STATUS.md` | Per-module implementation matrix |
| 4 | `MASTER_ARCHITECTURE.md` | Runtime + stack contract |
| 5 | `MASTER_DATABASE.md` | Schema, RLS, GRANTs |
| 6 | `MASTER_APIS.md` | Server-function + HTTP surface |
| 7 | `MASTER_MODULES.md` | Product surface inventory |
| 8 | `MASTER_FEATURES.md` | Feature-level status |
| 9 | `MASTER_ROADMAP.md` | Forward plan |
| 10 | `MASTER_AUDITS.md` | Audit trail R1 → Rn |
| 11 | `MASTER_FUTURE_PLAN.md` | P0–P9 execution priorities |
| 12 | `MASTER_PROJECT_INDEX.md` | Cross-reference index |
| G1 | `MASTER_FOUNDER_RULEBOOK.md` | Founder operating rules |
| G2 | `MASTER_DESIGN_SYSTEM.md` | Design tokens + primitives |
| G3 | `MASTER_UI_GUIDELINES.md` | Component + interaction rules |
| G4 | `MASTER_SECURITY_POLICY.md` | Security + RLS + secrets |
| G5 | `MASTER_RELEASE_POLICY.md` | Release + certification gates |

## 3. Status Vocabulary (closed set)

Every feature is exactly one of:

- **WORKING** — end-to-end verifiable in the running app
- **PARTIAL** — real code exists, gaps documented
- **BLOCKED** — waiting on schema, licence, or external asset
- **PLANNED** — designed but not implemented
- **MISSING** — nothing in repo yet

Never invent new labels. Never use "TODO", "in progress", "coming soon".

## 4. Definition of WORKING

A feature is WORKING only if it has all of:

1. UI (real component, not `V2TabBody`)
2. Backend (server function or HTTP route)
3. Runtime (executes against real data)
4. Database (tables + RLS + GRANTs)
5. API contract (typed, validated with Zod)
6. Error handling
7. Loading state
8. Empty state
9. Accessibility (keyboard + ARIA + SR)
10. Security (RLS or explicit auth check)
11. Typecheck clean
12. Verified (Playwright or manual walk-through evidenced in the audit)

Missing any single one → PARTIAL.

## 5. Prohibited Patterns

Never ship:

- Placeholder routes marked as complete
- `V2TabBody`-only pages counted as WORKING
- Fake runtimes (services returning hardcoded shapes)
- `NOT_IMPLEMENTED` services pretending to work
- Fake metrics, fake AI responses, fake billing, fake notifications
- Fake Digital Human (pre-recorded, non-live)
- Client-side role checks as the security boundary
- Service-role Supabase client in code paths reachable by end users

## 6. Digital Human Rule

HAPPY is:

- ONE Digital Human
- ONE Brain
- ONE Memory
- ONE Operating System

Never create separate assistants, sub-avatars, or forked identities.
Every enterprise module must integrate with HAPPY through
`src/lib/happy-tools.server.ts` (tool registry) and the `dhSpeak` loop.

## 7. Business Rule

Every business module (CRM, ERP, HRMS, Manufacturing, Warehouse,
Inventory, Finance, POS, Marketplace, Builder, Revenue, Cloud) must be
controllable through HAPPY tool calls — not just as an isolated UI.

## 8. Documentation Rule

Every merged feature MUST update, in the same change:

- `MASTER_STATUS.md`
- `MASTER_IMPLEMENTATION_STATUS.md`
- `MASTER_FEATURES.md`
- `MASTER_AUDITS.md` (new audit entry)

If the documentation is not updated, the implementation is incomplete
and MUST NOT be marked WORKING.

## 9. Certification Rule

- Individual modules may be certified after passing quality gates.
- The **platform** may NOT be certified as a whole until every critical
  module (Founder, Revenue, Financial, Notifications, Digital Human,
  Auth, Cloud, Builder) reaches WORKING.
- Certification is granted per audit round (R1, R2, …) and recorded in
  `MASTER_AUDITS.md`.

## 10. Amendments

Amendments to this Constitution require Founder approval and a new
version bump (1.0 → 1.1). The prior version must remain in git history
and be referenced from the changelog at the bottom of this file.

## Changelog

- **1.0** — Initial constitution ratified alongside the R6 Financial
  Foundation certification.

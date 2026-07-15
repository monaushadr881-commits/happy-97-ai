# HAPPY — MASTER RELEASE POLICY

**Version:** 1.0 · Governs when a module may be marked WORKING and
when the platform as a whole may be certified.

## 1. Release Units

- **Feature** — a single capability inside a module.
- **Module** — a product surface (e.g. Founder, Billing, Notifications).
- **Platform** — the entire HAPPY Enterprise stack.

Each unit has its own certification bar.

## 2. Quality Gates (per PR / audit round)

Before a feature can move to WORKING:

1. **Typecheck** — `tsgo` (or project equivalent) passes with no errors.
2. **Lint** — passes if configured.
3. **Playwright** — end-to-end path executed where applicable.
4. **Accessibility review** — checklist in `MASTER_UI_GUIDELINES.md` §8.
5. **Security review** — RLS + GRANTs + auth boundary confirmed.
6. **Performance review** — no N+1, no blocking sync work on main thread.
7. **Documentation update** — the four docs listed in
   `MASTER_CONSTITUTION.md` §8 are updated in the same change.
8. **STATUS update** — `MASTER_STATUS.md` reflects the new state.
9. **Implementation status update** — `MASTER_IMPLEMENTATION_STATUS.md`
   row updated with evidence links.

Missing any gate → PARTIAL.

## 3. Module Certification

A module may be certified WORKING when:

- Every user-visible feature in scope is WORKING or explicitly
  documented as out of scope for this round.
- A dedicated entry exists in `MASTER_AUDITS.md` naming the round
  (R1, R2, …), files changed, and verification method.
- The Founder acknowledges the certification in the audit entry.

## 4. Platform Certification

The platform may NOT be certified as a whole until every critical
module reaches WORKING:

- Auth
- Founder Command Center
- Notification Platform
- Revenue Cloud
- Financial Foundation (Plans, Subscriptions, Wallet, Credits)
- Digital Human (portrait + speech + tools loop)
- Cloud / Deployment
- At least one Business OS module end-to-end (e.g. CRM)
- At least one Builder end-to-end (Website Builder)

Until then, use "Modules certified: …" in reports; never claim
"HAPPY certified".

## 5. Round Numbering

- Rounds are sequential (R1, R2, …).
- Each round has a defined scope in the request.
- Never mark unrelated modules complete in a round.
- Each round writes exactly one new entry to `MASTER_AUDITS.md`.

## 6. Regression Protection

- Every fixed bug that reached WORKING previously requires a
  regression test (Playwright or unit) added in the same PR.
- Ledger tables have DB-level triggers preventing regression toward
  mutable rows.

## 7. Rollback

- Schema-breaking changes ship with a documented rollback path in the
  migration description.
- Feature flags (`src/kernel/feature-flags.ts`) gate risky rollouts;
  default OFF for anything not yet WORKING.

## 8. Communication

Release reports use the vocabulary from `MASTER_CONSTITUTION.md` §3:
WORKING · PARTIAL · BLOCKED · PLANNED · MISSING. Nothing else.

## 9. Post-Release

- Update `MASTER_STATUS.md` and `MASTER_IMPLEMENTATION_STATUS.md`.
- Append a `MASTER_AUDITS.md` entry.
- Note remaining gaps and the next planned round in
  `MASTER_FUTURE_PLAN.md`.

# HAPPY — MASTER FOUNDER RULEBOOK

**Version:** 1.0 · Governance companion to `MASTER_CONSTITUTION.md`.

Operating rules for the Founder role and the AI/engineering agents that
act on the Founder's behalf.

## 1. Founder-Only Decisions

Only the Founder may approve:

- Architectural pivots (framework, runtime, database)
- Breaking schema migrations (drop / rename / retype columns)
- Public API contract changes on `/api/public/v1/*`
- Security posture changes (RLS off, service-role widened, headers relaxed)
- Digital Human identity (name, voice, visual persona, greeting)
- Brand identity (logo, palette, typography lockup)
- Revenue model (plans, pricing tiers, credit economics)
- Company / brand structure under H.P PRIVATE LIMITED

Everything else follows the Constitution.

## 2. Agent Operating Rules

Any AI agent (Lovable, sub-agents) operating on the project MUST:

1. Read `MASTER_CONSTITUTION.md`, `MASTER_STATUS.md`, and
   `MASTER_IMPLEMENTATION_STATUS.md` before making non-trivial changes.
2. Only touch modules named in the current task. Never mark unrelated
   modules complete.
3. Never fake implementation, metrics, or certification.
4. Update the four documentation files listed in Constitution §8 in the
   same change that ships a feature.
5. Report status honestly using the closed vocabulary in Constitution §3.

## 3. Change Categories

| Category | Founder approval | Docs update | Example |
|---|---|---|---|
| Cosmetic UI | No | Optional | Copy tweak, spacing |
| Feature (isolated) | No | Required | New tab in existing module |
| Module (new) | Yes | Required | New route family |
| Schema (additive) | Yes | Required | New table + RLS |
| Schema (breaking) | Yes (explicit) | Required | Drop column |
| Security policy | Yes (explicit) | Required | New RLS pattern |
| Brand / DH identity | Yes (explicit) | Required | Rename HAPPY |

## 4. Audit Trail

Every implementation pass is recorded in `MASTER_AUDITS.md` as a numbered
round (R1, R2, …). Each entry includes:

- Round number and date
- Modules touched
- Files changed
- Status transitions (which items moved WORKING / PARTIAL / etc.)
- Verification method (typecheck, Playwright, manual)
- Remaining gaps

## 5. Escalation

If an agent encounters:

- Missing schema for a requested feature → mark BLOCKED, do NOT invent a table.
- Missing external asset (Live2D, Live3D) → mark BLOCKED, do NOT ship a stub avatar as WORKING.
- Ambiguous scope → ask the Founder before implementing.
- Conflicting docs → the higher-ranked doc in Constitution §2 wins; open a docs-fix task.

## 6. Communication

Reports to the Founder are:

- Short
- Honest about PARTIAL / BLOCKED / MISSING
- Never claim platform-wide certification
- Always list files changed and status transitions

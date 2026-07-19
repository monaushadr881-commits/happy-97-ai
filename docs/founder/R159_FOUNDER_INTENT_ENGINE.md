# R159 — Founder Intent Engine™

**Status:** Shipped (pure governance layer; zero new runtime).
**Locks:** R91 · R104 · R111 · R115B · R116 · R118 · R119 · R120 · R126 · R128 · R130 · R145 · R153 · R156 · R157 · R158.

## Objective
Founder speaks naturally (any modality). HAPPY understands, asks
clarifying questions when needed, produces a complete engineering plan,
and hands off to R158 Approval Gateway. Nothing executes without Founder
approval.

## Canonical Owners (reused, never replaced)

| Concern              | Canonical Owner |
|----------------------|-----------------|
| Intent / Brain       | `src/lib/brain/engine.ts` (R115B) |
| Memory               | `src/lib/memory/intelligence.ts` (R116) |
| Conversation         | `src/lib/conversation/*` (R115B) |
| Workspace            | `src/workspace/*` (R118) |
| File / Knowledge     | `src/lib/happy-r137/*` (R119/R137) |
| Search               | `src/lib/happy-r138/*` (R120/R138) |
| Creator OS           | `src/routes/_authenticated/studio.*` (R126/R141) |
| Revenue OS           | `src/lib/happy-r128/*` (R128) |
| Founder Dashboard    | `src/routes/_authenticated/founder.*` (R130) |
| Approval Gateway     | `src/lib/founder/approval-gateway.ts` (R158) |
| Security Center      | `src/components/founder/FounderSecurityCenter.tsx` (R157) |
| Identity Fortress    | `src/lib/founder/identity-fortress.ts` (R156) |
| Unlimited Policy     | `src/lib/founder/unlimited-policy.ts` (R153) |
| RBAC / Founder       | `public.user_roles` + `public.is_platform_founder` |
| Audit (immutable)    | `public.audit_logs` + `public.write_audit(...)` |

R159 adds ONE file — `src/lib/founder/intent-engine.ts` — plus tests and
this doc. Zero new tables, APIs, routes, dashboards, or runtimes.

## Files Changed
- `src/lib/founder/intent-engine.ts` (new — pure governance helper)
- `tests/unit/happy-r159.test.ts` (new — 7 tests)
- `docs/founder/R159_FOUNDER_INTENT_ENGINE.md` (this file)
- `docs/founder/FOUNDER_DECISIONS.md` — FD-159 appended
- `docs/founder/FOUNDER_REGISTRY.md` — FM526 appended

## Intent Types (21)
feature · bugfix · ui · ux · performance · security · business · marketing ·
revenue · creative · infra · deploy · automation · analytics · database · api ·
builder · digital_human · website · android · ios

## Planning Flow (9 stages)
`capture → normalize → understand → clarify → think → check → plan → present → handoff`

- **Understanding contract (8 fields):** goal · problem · priority · urgency ·
  affected_module · dependencies · risk · expected_result.
- **Clarify rule:** if any field is missing, HAPPY MUST ask — no guessing.
- **AI thinking artifacts (9):** requirements, acceptance criteria,
  architecture, affected modules/APIs/DB/UI/tests/docs.
- **Automatic checks (9):** architecture · duplicate runtime · duplicate API ·
  duplicate table · security · performance · scalability · accessibility ·
  backward compatibility.
- **Output plans (6):** engineering · implementation · testing · documentation ·
  rollback · deployment — fed into R158.
- **Founder presentation (8 fields):** matches R158 Explain Before Execute™.
- **Learning surfaces:** founder preferences, architecture rules, coding style,
  design style, brand rules, business rules — persisted via existing Memory.
- **Suggestion domains:** UX · architecture · performance · security · business
  (Founder always decides).

## Architecture Impact
None. Every capability consumes an existing canonical owner. Fully R91 /
R111 compliant. Handoff to R158 is by structured plan; no coupling.

## Security Impact
Every plan carries a tier via `tierForIntent()` → R158 `requirementsFor()`.
Destructive/database/revenue intents auto-classify as critical, forcing
password + OTP + Founder approval + preview + rollback + audit.

## Backward Compatibility
100%. Every helper is additive and pure.

## Tests
`tests/unit/happy-r159.test.ts` — 7 tests covering constants, modality
normalization, understanding completeness, clarify-vs-think routing,
pipeline advance, intent→tier mapping, plan-surface builder, and Founder
Dashboard snapshot.

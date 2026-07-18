# R153 — Founder Unlimited Privileges™

**Status:** SHIPPED (governance layer, pure — no new runtime).
**Locks:** R91 · R111 · R130 · R151.

## Objective
Platform Founder never consumes Credits, Subscription, Wallet, or any quota
across Credits · Subscription · Wallet · AI · Builder · Apps · Websites ·
Companies · Workspaces · Storage · API · Automation · Brain · Memory · Search ·
Digital Human · Conversation · Founder Dashboard · Creator Studio · Business
OS · Enterprise.

## Canonical Owners (extended, never replaced)

| Concern              | Canonical Owner |
|----------------------|-----------------|
| Founder Unlimited Policy | `src/lib/founder/unlimited-policy.ts` (**new, R153**) |
| Credits Engine       | `src/lib/credits/engine.ts` |
| Subscription Engine  | `src/lib/subscriptions/lifecycle.ts` |
| Wallet Engine        | `src/lib/wallet/engine.ts` |
| Revenue OS (R128)    | `src/lib/happy-r128/revenue-intelligence.ts` |
| Payment Runtime      | `src/lib/payments/*` |
| Founder Role Source  | `public.is_platform_founder` + `user_roles.role='founder'` |

R153 adds **one file** (`src/lib/founder/unlimited-policy.ts`) plus tests and
this doc. Zero new tables, APIs, routes, runtimes, or V2 forks.

## Policy Contract
- `isFounder(caller)` — from canonical Founder role only.
- `creditsCharged` → 0 for Founder.
- `walletDeduction` → 0 for Founder.
- `subscriptionRequired` → false for Founder.
- `quotaCheck` / `effectiveLimit` → Infinity for Founder.
- `assertFounderPrivilege` — denies restricted roles (`company_admin`,
  `workspace_admin`, `enterprise_admin`, `customer`, `developer`, `employee`,
  `partner`) even if the flag is somehow set.
- `policySnapshot` — observability only, no secrets, no PII.

## Scope Exclusion (hard)
NEVER applies to Company Admin, Workspace Admin, Enterprise Admin, Customer,
Developer, Employee, Partner. Enforced by `NON_FOUNDER_ROLES` guard.

## Impact
- **Database:** none.
- **APIs:** none.
- **Security:** additive; restricted-role guard prevents privilege bleed.
  Founder identity still resolved via existing `is_platform_founder` SECURITY
  DEFINER function; the policy layer is pure and cannot self-elevate.
- **Revenue:** deterministic zeroing for verified Founder callers; all other
  callers untouched (backward compatible).
- **Architecture:** governance helper, no new runtime.
- **Performance:** pure O(1) helpers.
- **Backward compatibility:** 100%.

## Tests
`tests/unit/happy-r153.test.ts` — 9 tests: identity, credit zeroing, wallet
zeroing, subscription waiver, quota infinity, effective limit, restricted-role
guard, capability coverage, snapshot.

## Evidence
- Code: `src/lib/founder/unlimited-policy.ts`
- Tests: `tests/unit/happy-r153.test.ts` (9/9 passing)
- Registry: FM514 in `docs/founder/FOUNDER_REGISTRY.md`
- Decision: FD-153 in `docs/founder/FOUNDER_DECISIONS.md`

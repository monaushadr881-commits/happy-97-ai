# Database security remediation — R302-S1

## Objective and baseline
Extends `revenue`, existing marketplace persistence, `job_queue`, and canonical audit — no duplication.
Local baseline: `274ed35aca9e71ca653515c61241ac3ebd7cebe6`; connected provider synchronization not verified.
Hosted Cloud was reachable. Drizzle history inspection reported consistency; legacy migration application history was not independently established.

## Inspection and confirmed attack paths
- `credit_ledger_insert` allowed owner-controlled credits with `entry_type=purchase`, `refund`, or `transfer_in`; ownership alone did not establish funding.
- `jq_scope` exposed every global job (`company_id IS NULL`) to authenticated users.
- `listing_purchases_buyer_write` allowed a buyer to fabricate an active entitlement, price, seller, and payment references.
- Inspected live policies, columns, constraints, role helpers, function definitions, trigger catalog, and role privileges. The existing purchase-request draft policy is distinct from marketplace purchase entitlements and was preserved.
- Inspected `src/lib/revenue/revenue.functions.ts`, the legacy queue schema migration, and the R195 purchase-request migration.

## Applied changes
`drizzle/migrations/0000_financial_write_lockdown_and_job_isolation.sql`:
- Denies credit and marketplace purchase INSERT policies and revokes client-role mutation privileges, including inherited PUBLIC grants.
- Removes anonymous queue access and client queue mutations. Global jobs require Founder authorization; company jobs retain the existing company-admin check.
- Adds mandatory financial mutation audit triggers using existing `audit_logs`. Audit failure aborts the transaction; no fail-open exception handler.
- No new runtime, no service-client workaround, no data writes or deployment.

Generated migration configuration/history and package dependencies were created by the migration tool. Added `tests/database-security.test.ts`, updated `AGENTS.md` and `roadmap.md`.

## Compatibility and limitations
Columns, stored rows, read policies, existing business role helpers, and approval mechanisms remain intact.
Existing `revGrantCredits` and `revApplyApprovedGrantCredits` use authenticated INSERT and now fail closed; this intentionally disables posting until the canonical writer can be safely integrated with server authority and governance. This is not full workflow compatibility.
No new privileged financial writer was introduced. Existing privileged callers still require review; this migration is containment, not financial workflow completion.

## Verification
- Live catalog: both anon/authenticated lack INSERT/UPDATE/DELETE on credit ledger, listing purchases, and queue.
- Live policy readback: financial INSERT checks are false; queue global reads require Founder.
- Audit triggers exist on both financial tables.
- Tests: 3 passed (mobile hook, anonymous queue denied with 42501, signed-in non-Founder global jobs filtered); 6 mutation-planning tests skipped.
- Initial mutation-planning probes returned PGRST107 (hosted EXPLAIN disabled), not an RLS result. No mutation probe is represented as passing.
- Automatic typecheck/build: latest observed build OK; no manual build/typecheck performed.

## Honest status and next round
PARTIAL — containment applied; findings are not marked resolved.
Remaining blockers: hosted financial mutation behavior/audit readback without violating the no-data-writes instruction; valid governed financial writer implementation; populated cross-tenant queue tests; Founder/legitimate-financial end-to-end checks. No broad security certification.
Next round: R302-S2 — reviewed governed financial writer integration and isolated adversarial transaction verification, with explicit permission for test data writes where necessary.
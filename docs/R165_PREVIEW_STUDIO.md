# R165 — AI Preview Studio™ + Founder Revenue Rule (Daily Free Credits)

**Status:** Governance + preview + revenue-policy layer. Pure additive.
Zero new runtime.

## Mandate
Before ANY implementation reaches production, the Founder must be able
to preview every change inside an isolated sandbox. Nothing reaches
production without Preview. Handoff always to **R158 Approval Gateway**.

## Canonical Owners Reused (no duplication)
Intent Engine (R159) · Software Architect (R161) · Code Review (R162) ·
QA (R163) · Impact Analyzer (R164) · Guardian AI (R160) · Approval
Gateway (R158) · Brain · Memory · Conversation · Workspace · Search ·
Knowledge · Creator · Revenue · Business OS · Founder Dashboard ·
Audit · RBAC · Happy ID · Analytics.

## Follows
R91 · R104 · R111 · R115B · R116 · R118 · R119 · R120 · R126 · R128 ·
R130 · R145 · R153 · R156 · R157 · R158 · R159 · R160 · R161 · R162 ·
R163 · R164.

## Preview Studio — Pipeline (10 stages)
intake → sandbox → render → simulate → overlay → aiReview → gate →
founderPresentation → audit → **handoff → R158**.

## Coverage
- **Surfaces (15):** website, landing pages, admin panels, founder
  dashboard, business OS, CRM, ERP, inventory, finance, creator,
  website/android/ios builder, digital human, creative studio.
- **Devices (8)** · **Display modes (5)** · **Simulations (11)** ·
  **Change previews (6)** · **Impact overlays (10)** ·
  **AI review checks (8)** · **Founder controls (8)**.

## Quality Gates → block + handoff to R158
architecture_break · duplicate_runtime · duplicate_api ·
duplicate_database · security_failure · critical_qa_failure ·
critical_review_failure.

## Compile-time Locks (Preview Package)
`canAutoDeploy: false`, `sandboxed: true`, `touchesProduction: false`,
`handoffTarget: "R158_ApprovalGateway"`, `reuseOnly: true`,
`newRuntime: false`.

---

## Founder Revenue Rule — Daily Free Credits

- **Default:** 5 daily free credits per free user.
- **Refresh:** daily; the daily bucket is **replaced**, never added.
- **No** accumulate · **No** carry-forward · **No** stacking · **No**
  storage of unused daily credits.
- Example — Day 1: 5, use 2, remaining 3. Day 2: available = 5 (NOT 8).
- **Purchased credits** remain intact; only the daily free bucket resets.
- **Subscription/Premium** uses a separate policy.
- **Server-authoritative:** balances are marked
  `authoritative: "server"`; any client-computed balance is rejected.

### Anti-Abuse (via Guardian AI R160)
multiple_accounts · device_farming · emulator_farming · vpn_farming ·
scripted_refresh · referral_abuse · credit_farming.

### Founder Controls
daily_free_credits · reset_time · rolling_24_hours · campaign_override ·
country_rules · premium_rules · enterprise_rules.

## Architecture Impact
None. Zero new tables. Zero new runtime. Additive constants + pure
functions only.

## Files
- `src/lib/founder/preview-studio.ts`
- `src/lib/founder/daily-credits-policy.ts`
- `tests/unit/happy-r165.test.ts`
- `docs/R165_PREVIEW_STUDIO.md`

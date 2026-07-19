# R170 — AI Competitor Intelligence™

**Pure governance + strategy layer.** No new runtime. No Competitor
Engine V2. No Scraping Engine. No private-data access.

## Canonical Owners (reuse only)

Brain (R114), Memory (R115), Conversation (R116), Workspace (R117),
Search (R118), Knowledge (R119), Analytics (R104), Business OS (R128),
Revenue OS (R126), R158 Approval Gateway, R159 Intent Engine, R160
Guardian AI, R161 Software Architect, R162 Code Review, R163 QA, R164
Impact Analyzer, R165 Preview Studio, R166 Rollback, R167
Documentation, R168 Optimization Advisor, R169 Learning Memory, R145
Founder Dashboard, R130 Audit, R153 Happy ID, R156 RBAC.

## Ethics

HAPPY AI uses **only** public information, founder-provided data,
official documentation, public pricing, public product pages, and
public release notes / roadmaps. It **never** copies source code,
designs, proprietary assets, or licensed content; **never** accesses
protected systems, bypasses authentication, scrapes restricted data,
or reverse-engineers competitor products.

`verifySignals()` rejects any signal whose `source` is in
`FORBIDDEN_SOURCES` and reports `ethicsCleared: false`.

## Pipeline

`intake → verifySources → gateEthics → collectPublicSignals →
buildComparisonMatrices → runGapAnalysis → scorePriority →
estimateEffortImpact → composeFounderReport → handoff`.

## Output

Executive Summary, Competitor Report, Gap Analysis, Priority Matrix,
Opportunity Report, Innovation Report, Founder Report.

## Handoff (recommendations only)

`R159 → R161 → R162 → R163 → R164 → R165 → R166 → R167 → R168 →
R158`. Compile-time lock: `canAutoImplement: false`.

## Company Profile (single source of truth)

- Legal name: **HAPPY PERSON PRIVATE LIMITED**
- Short name: **H.P PRIVATE LIMITED**
- Founder: **MO NAUSHAD RAZA QADRI**

Exported as `COMPANY_PROFILE` from
`src/lib/founder/competitor-intelligence.ts`; About pages, docs,
legal pages, and founder surfaces must read from this constant.

## Daily Free Credits

Default 5, refresh daily, never accumulate, never carry forward.
Purchased credits remain intact. Server-authoritative. Guardian AI
detects credit farming.

## Verification

`tests/unit/happy-r170.test.ts` — 10/10 green. No new runtime; every
symbol reuses existing canonical owners.

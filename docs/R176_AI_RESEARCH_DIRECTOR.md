# R176 — AI Research Director™

**Phase:** Pure Governance + Research Leadership. **NO new runtime. NO V2.**
**Locks followed:** R91 · R104 · R111 · R114–R120 · R126 · R128 · R130 ·
R145 · R153 · R156 · R157 · R158 · R159 · R160–R170 · R171 · R172 · R173 ·
R174 · R175.

## Files Changed
- `src/lib/founder/ai-research-director.ts` — new pure governance module.
- `tests/unit/happy-r176.test.ts` — 12 unit tests.
- `docs/R176_AI_RESEARCH_DIRECTOR.md` — this document.
- `docs/founder/FOUNDER_DECISIONS.md` — FD-176 (append).
- `docs/founder/FOUNDER_REGISTRY.md` — FM528 (append).
- `docs/MASTER_ARCHITECTURE_LOCK.md` — reference R176.

## Canonical Owners (reuse only)
Brain (R114), Memory (R115), Conversation (R116), Workspace (R117),
Search (R118), Knowledge (R119), Analytics (R104/R120), Creator (R126),
Revenue OS (R128), Business OS (R145), Founder Dashboard (R130),
Guardian AI (R160), Approval Gateway (R158), Intent Engine (R159),
Software Architect (R161), Code Review (R162), QA Engineer (R163),
Impact Analyzer (R164), Preview Studio (R165), Rollback (R166),
Documentation (R167), Optimization Advisor (R168), Learning Memory (R169),
Competitor Intelligence (R170), AI CTO/COO/CFO/CPO/CGO (R171–R175),
Audit (R130), RBAC (R156), Happy ID (R153).

## Responsibilities (12)
technology_research · ai_research · market_research · framework_research ·
infrastructure_research · architecture_research · developer_tool_research ·
security_research · performance_research · business_research ·
future_platform_research · standards_research.

## Research Domains (18)
artificial_intelligence · llms · multimodal_ai · mobile · web · cloud ·
security · databases · networking · xr · ar · vr · vision_pro · metahuman ·
nvidia_ace · live2d · developer_tools · enterprise_software.

## Research Types (8)
technology_review · feasibility_study · proof_of_concept_plan · risk_analysis
· cost_analysis · roi_analysis · trend_analysis · architecture_analysis.

## Source Policy
- **Allowed:** founder_knowledge · approved_internal_documentation ·
  official_documentation · public_standards · public_specifications ·
  academic_papers · official_sdk_documentation.
- **Forbidden (hard reject):** leaked_information · private_repositories ·
  protected_documentation · unauthorized_apis · reverse_engineering ·
  copyright_violations. `validateSources()` blocks these compile-side;
  candidates with any forbidden source score `0` and route to `reject`.

## Evaluation Axes (8) & KPIs (8)
Axes: benefits · risks · cost · complexity · dependencies · compatibility ·
scalability · maintainability. `scoreOverall()` weights positives (benefits
0.35, scalability 0.15, maintainability 0.10, compatibility 0.10) minus
negatives (risks 0.20, cost 0.10, complexity 0.10) plus TRL bonus up to 15.

KPIs: innovation_score · research_confidence · technology_readiness ·
feasibility_score · risk_score · business_value · engineering_value ·
overall_research_score.

## Recommendations (5)
adopt · evaluate_later · prototype · reject · needs_more_research.
Routing: forbidden source → reject; overall ≥ 70 & TRL ≥ 7 → adopt;
≥ 55 → prototype; ≥ 40 → evaluate_later; ≥ 20 → needs_more_research;
else reject. Founder-requested items get +15 ROI boost.

## Forecast & Report
`forecastAdoption()` — per-candidate 30d / 90d / 12m adoption likelihood
(scaled 0.4 / 0.7 / 1.0 of overall). `composeResearchReport()` — executive
summary, findings, comparison table (sorted by overall DESC), future
opportunities, severity-sorted risks, KPIs, recommendations, forecast,
estimated cost/ROI, priority actions, council conflicts.

## Governance Locks (compile-time)
`canImplement: false` · `canDeploy: false` · `canAccessPrivateInfo: false` ·
`canAutoImplement: false` · `newRuntime: false` · `reuseOnly: true` ·
`handoffTarget: "R158_ApprovalGateway"`. Handoff chain: R159 → R161 →
R162 → R163 → R164 → R165 → R166 → R167 → R168 → R158.

## Executive Council
Collaborates ONLY with AI CTO (R171), AI COO (R172), AI CFO (R173),
AI CPO (R174), AI CGO (R175). Conflicts surface in
`ResearchReport.councilConflicts`.

## Revenue Policy (unchanged, inherited)
Daily Free Credits = 5, no accumulation, no carry-forward,
server-authoritative, deduction order daily_free → subscription →
purchased.

## Architecture Impact
None. Additive, pure helper; no new tables, APIs, routes, dashboards,
or runtimes.

## Security Impact
Source-policy enforcement is compile-side (`FORBIDDEN_SET`). Any candidate
touching forbidden sources scores 0, routes to `reject`, and raises a
`compliance_risk` at `critical` severity. Cannot implement, deploy, or
access private information.

## Backward Compatibility
100%. Every helper is pure and additive.

## Tests
`tests/unit/happy-r176.test.ts` — 12 tests covering taxonomy, canonical
owner integrity, source validation, scoring/priority math, evaluation
zeroing on forbidden sources, comparison ordering, recommendation
routing, KPI bounds, risk detection, monotonic forecast, report
composition, and policy locks.

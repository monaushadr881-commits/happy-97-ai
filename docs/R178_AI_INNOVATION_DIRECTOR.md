# R178 — AI Innovation Director™

Pure governance + innovation leadership layer. No new runtime, no
Innovation/Research/Idea/Future engine V2, no duplicate.

## Canonical Owners Reused
R104 Analytics, R114 Happy ID, R115 Brain, R116 Memory, R117 Conversation,
R118 Workspace, R119 Files, R120 Search, R126 Creator, R128 Revenue,
R130 Audit, R145 Founder Dashboard, R153/R156 Founder, R158 Approval Gateway,
R159 Intent, R160 Guardian, R164 Impact, R168 Optimization, R169 Learning,
R170 Competitor, R171 CTO, R172 COO, R173 CFO, R174 CPO, R175 CGO,
R176 Research Director, R177 Release Director, RBAC.

## Responsibilities (10)
innovation_strategy, future_product_ideas, research_to_product,
technology_adoption, experimental_planning, innovation_roadmap,
platform_evolution, future_platform_planning, ip_opportunity_review,
long_term_vision.

## Innovation Sources (7 allowed)
founder_idea, approved_research, approved_learning, competitor_intelligence,
public_technology_trend, approved_user_feedback, approved_business_report.

## Forbidden Sources (6, auto-reject)
leaked_information, copied_product, copied_source_code, protected_data,
unlicensed_material, unauthorized_information.

## Innovation Domains (18)
artificial_intelligence, digital_humans, creator_studio, business_os,
revenue_os, android, ios, website, xr, ar, vr, vision_pro, metahuman,
nvidia_ace, live2d, enterprise_automation, developer_experience,
future_platforms.

## Idea Lifecycle (10)
capture → classify → research → feasibility → roi → risk → priority →
roadmap → founder_review → r158_handoff.

## Pipeline Queues (6)
idea_backlog, innovation_queue, research_queue, prototype_queue,
future_roadmap, long_term_vision.

## Evaluation Axes (10)
business_value, engineering_value, founder_value, user_value, cost, risk,
complexity, dependencies, scalability, maintainability.

## KPI Dimensions (8)
innovation_score, future_readiness, research_score, business_value,
engineering_value, risk_score, roi_score, overall_innovation_score.

## Recommendations (6)
prototype, research_more, build_later, archive, reject, immediate_opportunity.

## Founder Controls (7)
approve, reject, modify, archive, bookmark, compare, schedule.

## Executive Council (7)
R171 CTO, R172 COO, R173 CFO, R174 CPO, R175 CGO, R176 Research Director,
R177 Release Director. Blocking votes surface via `councilConflicts`.

## Hard Locks
- `canBuild: false`
- `canDeploy: false`
- `canChangeProduction: false`
- `canAutoImplement: false`
- `canBypassApprovalGateway: false`
- `newRuntime: false`, `reuseOnly: true`
- `handoffTarget: "R158_ApprovalGateway"`

## Files
- `src/lib/founder/ai-innovation-director.ts`
- `tests/unit/happy-r178.test.ts` (10/10 green)
- `docs/R178_AI_INNOVATION_DIRECTOR.md`

## Architecture / Security Impact
None. Pure additive TS module. No schema, no routes, no runtime. Reuses
existing canonical owners; every recommendation routes through R158.
Forbidden-source ideas are auto-rejected with `compliance_risk: critical`.

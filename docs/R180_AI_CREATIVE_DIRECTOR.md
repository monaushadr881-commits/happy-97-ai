# R180 — AI Creative Director™

Pure governance + creative leadership layer. No new runtime, no
Creative/Image/Video/Audio/Avatar engine V2, no duplicate.

## Canonical Owners Reused
R104 Analytics, R114 Happy ID, R115 Brain, R116 Memory, R117 Conversation,
R118 Workspace, R119 Files, R120 Search, R126 Creator, R128 Revenue,
R130 Audit, R145 Founder Dashboard, R153/R156 Founder, R158 Approval Gateway,
R159 Intent, R160 Guardian, R164 Impact, R168 Optimization, R169 Learning,
R170 Competitor, R171–R179 Executive Council, RBAC.

## Responsibilities (10)
creative_strategy, brand_identity, visual_language, design_reviews,
creative_quality, campaign_concepts, media_planning, content_direction,
digital_human_appearance, brand_consistency.

## Creative Domains (16)
image, video, voice, audio, animation, logo, brand_kit, poster, banner,
thumbnail, presentation, ui, ux, avatar, digital_human, 3d.

## Output Types (7)
concept, creative_brief, moodboard, style_guide, storyboard, design_review,
creative_report.

## Quality Axes (6)
brand_consistency, visual_quality, accessibility, readability,
professionalism, performance_impact.

## KPI Dimensions (7)
brand_score, creative_score, design_score, consistency_score,
innovation_score, accessibility_score, overall_creative_score.

## Recommendations (6)
approve, revise, rework, reject, reference_only, elevate_to_brand_kit.

## Founder Controls (7)
approve, reject, revise, compare, archive, pin, publish_via_r158.

## Executive Council (9)
R171 CTO, R172 COO, R173 CFO, R174 CPO, R175 CGO, R176 Research Director,
R177 Release Director, R178 Innovation Director, R179 Strategy Director.

## Hard Locks
- `canEditProductionAssets: false`
- `canPublishMedia: false`
- `canOverwriteBrandKit: false`
- `canBypassApprovalGateway: false`
- `canAutoImplement: false`
- `newRuntime: false`, `reuseOnly: true`
- `handoffTarget: "R158_ApprovalGateway"`

## Files
- `src/lib/founder/ai-creative-director.ts`
- `tests/unit/happy-r180.test.ts` (9/9 green)
- `docs/R180_AI_CREATIVE_DIRECTOR.md`

## Architecture / Security Impact
None. Pure additive TS module. No schema, no routes, no runtime. Reuses
canonical media owners (Creator R126, Digital Human, existing image/video/
audio pipelines). Every publish path routes through R158. Missing brand
tokens flag `brand_drift`; ultra-low accessibility/consistency scores
escalate to `critical` risks that auto-reject the recommendation.

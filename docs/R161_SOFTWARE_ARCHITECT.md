# R161 — AI Software Architect™ (Chief Engineering Architect)

**Status:** IMPLEMENTED (repo-side) · **Owner:** `src/lib/founder/software-architect.ts` · **Tests:** `tests/unit/happy-r161.test.ts` (7/7)

## Follows
R91, R104, R111, R115B, R116, R118, R119, R120, R126, R128, R130, R145, R153, R156, R157, R158, R159, R160.

## Mandate
HAPPY becomes the Platform Software Architect. Founder describes a goal; HAPPY produces a complete engineering architecture, hands off to R158 Approval Gateway, and **never auto-executes**. Pure governance layer — NO Brain V2, NO Architecture V2, NO Planner V2, NO Builder V2, NO Software Architect V2.

## Canonical Owners Reused
| Concern | Owner |
|---|---|
| Intent capture + clarification | R159 `src/lib/founder/intent-engine.ts` |
| Explain → Preview → Approve → Execute | R158 `src/lib/founder/approval-gateway.ts` |
| Threat/security scoring on the plan | R160 `src/lib/founder/guardian-ai.ts` |
| Reasoning | R115B `src/lib/brain/engine.ts` |
| Memory classification for context | R116 `src/lib/memory/intelligence.ts` |
| Hybrid semantic search of existing modules | R138 `src/lib/happy-r138/semantic-knowledge.ts` |
| File/PDF/whiteboard ingestion | R137 `src/lib/happy-r137/file-intelligence.ts` |
| Audit | `public.audit_logs` + `write_audit(...)` |

## Pipeline (11 stages)
intake → analyse → discover → **duplicateCheck (hard gate)** → design → plan → quality → cost → risk → present → **handoff to R158**.

## Coverage
- **Input modes (10):** text, voice, image, video, screenshot, whiteboard, pdf, document, url, mixed.
- **Analysis fields (10):** businessGoal, technicalGoal, priority, scope, complexity, dependencies, affectedSystems, risk, estimatedCost, estimatedTime.
- **Discovery surfaces (8):** existing modules/APIs/tables/builders/components/services/documents/tests.
- **Duplicate checks (7):** runtime, api, database, ui, builder, service, business_logic — any hit blocks the plan.
- **Architecture artifacts (8):** systemArchitecture, moduleDiagram, dataFlow, serviceFlow, componentMap, dependencyGraph, folderImpact, fileImpact.
- **Engineering plans (9):** frontend, backend, database, api, security, testing, deployment, rollback, migration.
- **Quality dimensions (7):** performance, security, accessibility, scalability, maintainability, compatibility, reliability.
- **Cost buckets (5):** development, infrastructure, ai, storage, operational.
- **Risk categories (6):** architecture, security, performance, migration, business, deployment.
- **Competitors (8):** ChatGPT, Claude, Gemini, GitHub, Notion, Canva, Slack, Shopify.
- **Founder-presentation fields (11):** whatChanges, why, benefits, risks, estimatedTime, estimatedCost, affectedModules, affectedFiles, affectedApis, affectedDatabase, rollbackAvailable.

## Hard Locks
- `ArchitectPackage.canAutoExecute: false` is a compile-time literal — the type system prevents flipping it.
- `handoffTarget = "R158_ApprovalGateway"` is the only downstream contract.
- Duplicate detection blocks package emission before it reaches R158.
- Missing analysis fields block planning (enforces R159 "Ask, don't guess").

## Architecture Impact
None. No new routes, no new tables, no new runtimes. Pure additive TypeScript module.

## Tests
`tests/unit/happy-r161.test.ts` — 7 tests: constants, modality normalization, duplicate-gate, ask-don't-guess enforcement, pipeline routing, approval-package handoff, zero-execute contract.

## Backward Compatibility
100%.

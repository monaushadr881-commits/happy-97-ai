## Repository truth first

Your spec lists ~377 capabilities. Most already exist in this repo and must be extended, not rebuilt:

- **Builders** — 43 routes (`builder.website`, `builder.mobile`, `builder.fullstack`, `builder.database`, `builder.api`, `builder.agents`, `builder.workflow`, plus 20+ verticals), all wired through `src/lib/builder/builder-submit.functions.ts` → the 13-stage canonical pipeline.
- **Business OS / ERP / CRM / HR / Finance / Inventory / Manufacturing** — `business.*` routes + `src/lib/business/*`.
- **Creative Studio, Digital Human, Knowledge, Cloud, Communication, Analytics, Security, Deployment, Marketplace, Revenue/Billing** — all have canonical routes and runtimes.
- **Approval gates, audit, memory, Mission Control, Universal Prompt Bar, Universal Action Bar** — canonical and single-owner.

What the spec asks for that the repo does **not** yet have as a canonical owner:

1. **Natural Language Command Engine** — no module converts "Happy, build me an app" into Intent → Requirements → Plan → Tasks → Agents → Execution. Prompt bars currently route to a preset builder, not to intent detection.
2. **HAPPY Command Center** — no single route with the 24-surface unified overview (`founder-enterprise.tsx` is the closest, but it is a tile hub, not a command surface).
3. **Agent roster + delegation** — the 23 named AI agents (PM, Architect, Developer, QA, DevOps, SEO…) have no canonical registry; `founder/executive/members.ts` covers only the board.

Everything else is extension work on existing owners.

## Why this is not one build

Your own §49 says build in phases, and `docs/R183_MIGRATION_GUARDRAILS.md` caps every batch at 20 handlers with a Build + Typecheck + Tests gate and a full stop on first failure. I will follow that. No repo-wide codemods, no shells presented as functional.

## Batch 1 (this turn, on approval)

**Natural Language Command Engine + HAPPY Command Center**

New canonical owner `src/lib/happy-command/`:
- `intent-registry.ts` — intent taxonomy (build_app, build_website, build_game, fix_bug, deploy, connect_domain, inspect_production, create_content, create_campaign, analyze_business, create_agent, manage_knowledge, automate_task) with keyword + AI classification, target route, risk level, approval requirement.
- `agent-roster.ts` — the 23 named agents: id, role, capabilities, canonical runtime owner, permissions, approval scope.
- `command.functions.ts` — ≤12 handlers, all through `adoptToCanonicalPipeline()` + `withBrain()`:
  - `interpretCommand` — natural language → intent + confidence + extracted requirements
  - `planCommand` — intent → requirement analysis → plan → risk analysis → task decomposition
  - `assignAgents` — plan tasks → agent roster assignments
  - `submitCommand` — approval-gated execution dispatch to the existing canonical runtime
  - `listCommands` / `getCommand` / `cancelCommand` — command history and control
  - `commandCenterOverview` — aggregate counts across projects, tasks, deployments, agents, activity

New route `src/routes/_authenticated/command-center.tsx`:
- Command input using the existing `HappyUniversalPromptBar` (no second composer).
- Interpretation panel: detected intent, confidence, requirements, plan, risk, agent assignments.
- Approve / Reject controls for approval-required commands, showing Action → Reason → Impact → Target → Expected result.
- Unified overview grid across the 24 spec surfaces, linking to existing canonical routes.
- Live command history with status.

Guarantees: no new runtime, no duplicate memory/approval/audit/pipeline. Every execution path delegates to the existing owner. Build + Typecheck + Tests must pass before I report done.

## Batch order after that

2. Agent runtime: multi-agent collaboration, delegation, supervision, logs (extends `agent-roster` + existing jobs runtime).
3. Task system: queue, scheduling, recurring, real-time monitoring, error recovery (extends `jobs.service`).
4. App Factory workflow: Idea → PRD → Architecture → … → Monitoring as a real staged record per project.
5. Live application control: inspect, error detection, fix generation, rollback.
6. Model abstraction + routing layer (task/quality/speed/cost/plan) over `ai.service`.
7. Skills + Plugin system with permission scopes.
8. Agent Store: publish, subscribe, rate, revenue (extends marketplace + revenue runtimes).
9. Game Factory.
10. Observability: HAPPY System Monitor over existing ops services.

One batch per turn, each independently Green.

## Technical notes

- Every new handler declares "Extends `<owner>` — no duplication" per `docs/MASTER_ARCHITECTURE_LOCK.md`.
- Intent classification uses the existing `aiService.chat` (Lovable AI Gateway) — no new provider path.
- Command records persist via the existing audit + mission-control tables; a migration is added only if a `happy_commands` table is genuinely required, with GRANTs and RLS scoped to owner + company admin.
- No claim of completeness beyond what the batch gate verifies.

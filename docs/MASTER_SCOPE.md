# HAPPY AI ENTERPRISE OS — MASTER SCOPE (R300)

Status: **CANONICAL SCOPE DOCUMENT**. Supersedes nothing; sits above
`MASTER_CORE_VISION_LOCK.md` (R91) and `MASTER_ARCHITECTURE_LOCK.md` (R111)
as the scope definition they are measured against.

## 0. Hierarchy rule (non-negotiable)

Four SEPARATE levels. Never merged into one flat list, never summed:

```text
LEVEL 1  502 Canonical Modules        — numbering + ownership frozen
LEVEL 2  Founder Extensions           — layered ON TOP of a canonical module
LEVEL 3  3,000+ Granular Features     — capabilities INSIDE a module/extension
LEVEL 4  Surfaces: 1,000+ screens · hundreds of APIs · hundreds of DB entities
```

Totals may only be claimed after an item-by-item deduplication audit.
A capability with a different NAME but the same behaviour is a FEATURE of the
existing module — never a new module.

## 1. Measured repository baseline (verified this round)

| Surface | Verified count | Source of truth |
|---|---|---|
| Canonical business modules | 502 (registry) | `docs/founder/FOUNDER_REGISTRY.md` |
| Server handlers (`createServerFn`) | 603 across 55 modules | source scan |
| Canonical pipeline invocations | 379 | `adoptToCanonicalPipeline` / `withBrain` |
| Authenticated route files | 164 | `src/routes/_authenticated/` |
| React screens/components | 262 `.tsx` | source scan |
| Public HTTP API routes | 3 | `src/routes/api/**` |
| Database tables | 363 | generated types |
| Database views | 3 | generated types |
| Database RPCs | 7 | generated types |
| Migrations applied | 13 files, 111 `create table` | `supabase/migrations/` |

Screens (262) and modules (502) are DIFFERENT levels. One route commonly
renders 5–30 module features; do not treat routes as module coverage.

## 2. Canonical owners (extend these — never duplicate)

| Capability domain | Canonical owner | Notes |
|---|---|---|
| Founder pipeline (13 stages) | `src/lib/founder/pipeline.ts` | ONLY execution spine |
| Brain / reasoning | `src/lib/founder/with-brain.ts` | no second Brain |
| Approvals (R158) | `src/lib/founder/approval.functions.ts` + `public.approvals` | no second engine |
| Audit | `src/lib/founder/audit.ts` → `write_audit` → `audit_logs` | no second log |
| Founder gate | `src/lib/founder/enforce.ts` | all Founder-gated actions |
| Executive review | `src/lib/founder/executive/` | board aggregation |
| Command / NL engine | `src/lib/happy-command/command-*.ts` | Universal Command System |
| Missions | `src/lib/happy-command/mission-*.ts` | 10-phase blueprints |
| Agents / skills / tools | `agent-roster.ts`, `skill-registry.ts`, `tool-registry.ts` | 48 agents |
| Execution + adapters | `execution-core.ts`, `tool-adapters.server.ts`, `skill-executor.server.ts` | real tools only |
| Memory | `src/lib/memory/memory.functions.ts` | single memory |
| Knowledge / graph | `src/lib/knowledge/`, `knowledge-v1.functions.ts` | single KOS |
| Workspace / search | `src/lib/founder/workspace-knowledge.functions.ts`, `search.functions.ts` | one search |
| Builders (42 verticals) | `src/lib/builder/builder-submit.functions.ts` + `use-builder-prompt.ts` | shells stay thin |
| Business OS | `src/lib/business/*`, `business-v1.functions.ts` | CRM/ERP/HRMS/Fin |
| Creator / Publishing | `creator-v1.functions.ts`, `founder/publishing.functions.ts` | brand + watermark |
| Digital Human | `src/lib/digital-human/*`, `src/components/digital-human/*` | ONE persona |
| Marketplace / CMOS | `src/lib/cmos-v1.functions.ts` | one marketplace core |
| Revenue / credits | `src/lib/revenue/*` | one ledger |
| Ops / observability | `src/ops/*`, `src/lib/ops-v1.functions.ts` | one ops layer |
| Identity / RBAC | `src/lib/identity/identity-runtime.functions.ts` | roles table only |
| Services infra | `src/services/*` | shared, stateless |
| Universal UI | `HappyUniversalPromptBar`, `HappyUniversalActionBar` | one each |

## 3. Master-scope status classification

**COVERED** (canonical owner exists and is pipeline-wired)
AI Core · Universal Prompt Bar · Universal Command System · NL Command Engine ·
Universal Search · Mission Control · Mission System · AI workforce roster ·
agent skills/tools/execution · memory · knowledge OS · Founder/Company/Workspace
Brain · goal + multi-step execution · workflow automation · task queue · approval
and escalation · real-time monitoring · 42 AI builders · code/deploy/rollback
surfaces · Digital Human persona + expressions + voice modes · research runtime ·
creator studios · marketplace · Business OS (commerce, sales, orders, finance,
inventory, procurement, manufacturing, logistics, dealers, BI) · enterprise ops
(HRMS, LMS, documents, tasks, calendar, helpdesk) · communication · security and
governance · developer/cloud platform · billing · Founder Control Center.

**EXTENSION** (canonical owner exists; add features into it, no new module)
Agent collaboration · agent orchestration · agent marketplace listing flow ·
memory consolidation + permissions · cross-project/cross-agent context ·
knowledge graph depth · recurring/scheduled automation depth · trigger/condition
engine UI · queue priority manager · deep research + source verification +
citations · social channel connectors (Instagram/YouTube/Facebook/LinkedIn/X) ·
inbox intelligence · reputation/engagement · white-label controls · brand
compliance checks · published-artifact watermark enforcement · spending controls
UI · data access controls · admin reports.

**OVERLAP → consolidate (no new code, route to canonical owner)**
- `cloud.tsx` vs `cloud-platform.tsx` · `analytics-platform.tsx` vs
  `founder.analytics.tsx` vs `business.analytics.tsx` · `crm.tsx` vs
  `business.crm.tsx` · `erp.tsx`/`hr.tsx`/`finance.tsx` vs `business.*` ·
  `security-center.tsx` vs `founder.security.tsx`/`enterprise.security.tsx` ·
  `ai-os.tsx` vs `business-os.tsx` vs `founder-enterprise.tsx` vs `platform.tsx`.
- Resolution: these are SHELLS. Keep one canonical shell per domain, others
  become links. No runtime, no data layer, no duplicate handlers.

**MISSING (foundational, not yet in repo)**
1. Agent Swarm + swarm coordination (0 references).
2. Agent Sandbox + Kill Switch + hard tool restrictions (0 references).
3. Computer Control: keyboard/mouse automation, computer vision loop (stub only).
4. Browser Agent: real browser automation, login/session handling, form filling,
   web extraction as a governed tool adapter.
5. AI Filesystem as a first-class capability (file understanding, classification,
   conversion, versioning) — 0 references.
6. Voice Command System (voice → command engine path) — 0 references.
7. Fact-checking / source verification engine for Research.
8. Watermark + white-label enforcement at publish time (1 weak reference).
9. Plugin marketplace + plugin runtime (5 weak references).
10. Public API platform surface (only 3 API routes exist).

**NEEDS DECISION (Founder)**
- Computer/browser control execution host (server runtime cannot spawn
  processes; requires an external worker or user-side agent).
- Native store credentials, streaming voice, rigged avatar assets — remain
  externally BLOCKED per R91.
- Whether Agent Marketplace monetises through the existing credit ledger.

## 4. Dependency graph

```text
Identity/RBAC ─┐
Audit ─────────┤
Approvals ─────┼─→ Founder Pipeline (13 stages) ─→ Execution Core ─→ Tool Adapters
Brain ─────────┤                │                        │
Memory ────────┤                │                        ├─ Business OS
Knowledge ─────┤                │                        ├─ Builders
Workspace ─────┘                │                        ├─ Creator/Publishing
                                │                        ├─ Research
                                ↓                        └─ Digital Human
                        Mission Control (visibility: status, logs, approvals)

Governance wrappers (must exist BEFORE new autonomy):
  Agent Permissions → Sandbox → Tool Restrictions → Spending Limits → Kill Switch
```

Rule: nothing new executes outside the pipeline, and no new autonomy
(swarm, computer control, browser control) ships before the governance
wrappers above exist.

## 5. Implementation roadmap (priority order)

**P0 — Governance before autonomy**
- R301 Agent Governance: sandbox scopes, tool restrictions, spending limits,
  global + per-agent kill switch. Extends `tool-registry.ts` + `execution-core.ts`.
- R302 Security finding closure + RLS hardening (credit ledger, job queue,
  listing purchases) — server-side verified writes only.

**P1 — Missing foundations**
- R303 AI Filesystem (extends Cloud + Knowledge owners).
- R304 Browser Agent + Web Extraction as governed tool adapters.
- R305 Voice Command System (voice → NL Command Engine, no new engine).
- R306 Research hardening: source verification, fact check, citations.
- R307 Watermark + white-label enforcement in Publishing.

**P2 — Extensions**
- R308 Agent Collaboration + Orchestration + Swarm (on mission system).
- R309 Memory consolidation, permissions, cross-project context.
- R310 Automation depth: triggers, conditions, recurring, priority manager.
- R311 Plugin runtime + Agent/Plugin marketplace listings.
- R312 Public API platform + developer keys.

**P3 — Consolidation and surface polish**
- R313 Shell consolidation per §3 OVERLAP.
- R314 Computer Control (blocked until execution host decision).

## 6. Quality gates (every batch)

Max 20 handlers/components per batch · Build + Typecheck + Tests GREEN before
next batch · first failure = full stop · every change states
`Extends <canonical owner> — no duplication` · no repo-wide codemods ·
no "100% / Production Ready / Certified" claims without verified tests.

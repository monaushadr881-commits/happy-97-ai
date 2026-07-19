# R171 — AI CTO™

Pure governance + technology-leadership layer. No new runtime, no
CTO V2, no Engineering V2, no Planning V2, no duplicate planner.

## Canonical Owners (reuse only)

Brain (R114), Memory (R115), Conversation (R116), Workspace (R117),
Search (R118), Knowledge (R119), Creator (R120), Business OS (R128),
Revenue OS (R126), Analytics (R104), Founder Dashboard (R145),
Guardian AI (R160), R158 Approval Gateway, R159 Intent Engine, R161
Software Architect, R162 Code Review, R163 QA, R164 Impact Analyzer,
R165 Preview Studio, R166 Rollback, R167 Documentation, R168
Optimization Advisor, R169 Learning Memory, R170 Competitor
Intelligence, R130 Audit, R156 RBAC, R153 Happy ID.

## Responsibilities

Technology Vision, Architecture Vision, Engineering Roadmap,
Technical Debt, Scalability, Security Strategy, Infrastructure
Planning, AI Strategy, Release Planning, Platform Evolution.

## Roadmap Horizons

30-day, 90-day, 6-month, 1-year, 3-year — every item priced with
ROI + effort and scored via `scorePriority()`.

## KPIs

Architecture, Engineering, Release, Performance, Security, Quality,
Innovation, and Overall Technology Score.

## Rules

- AI CTO **never writes production code** (`canWriteProductionCode:
  false`).
- AI CTO **never bypasses R158** (`handoffTarget:
  "R158_ApprovalGateway"`).
- AI CTO **always recommends; Founder decides**
  (`canAutoImplement: false`).

## Handoff

`R159 → R161 → R162 → R163 → R164 → R165 → R166 → R167 → R168 →
R158`.

## Verification

`tests/unit/happy-r171.test.ts` — 9/9 green. Typecheck clean.

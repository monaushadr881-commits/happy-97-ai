# HAPPY Brain Infinity

Reference architecture for the HAPPY reasoning + memory + planning runtime.
This document describes the target design. Actual engines live under
`src/lib/brain-*.functions.ts` and are implemented incrementally.

## Engines
- Reasoning, Planning, Execution, Memory, Knowledge, Reflection, Learning,
  Decision, Conversation, Founder Intelligence.

## Memory tiers
- Short-term (session), Long-term (Supabase), Founder, Company, Brand,
  Customer, Project, Conversation, Preference, Learning, Relationship,
  Task, Document, Meeting, Business.

## Planning surfaces
- Daily / Weekly / Monthly / Quarterly / Annual / Roadmap / Business /
  Execution / Meeting / Deployment planners.

## Autonomous executive
- Morning brief, evening brief, revenue/security/deployment/AI/business/
  risk/opportunity summaries, priority recommendations.

Architecture, DB, RBAC, and security are frozen; every engine is an additive
`createServerFn` module and never mutates existing tables or policies.

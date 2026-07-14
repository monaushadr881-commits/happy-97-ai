# HAPPY Roadmap — v2.0 to v6.0 (Architecture Integration)

This document is the **contract** between today's platform and the roadmap
that follows HAPPY Enterprise v1.0. Every module below is already reflected
in the codebase — routes, navigation, feature flags, permissions, service
interfaces, and API contracts exist. Only implementation remains.

**No redesign is ever required.** Each phase replaces reserved service
internals; the surface stays stable.

---

## v2.0 — AI Agent OS & Developer Platform

| Area | Reserved surface |
|---|---|
| Route | `/agent-os` (`src/routes/_authenticated/agent-os.tsx`) |
| Module registry | `agent-os` (group: `roadmap`, version: `v2.0`) |
| Permissions | `agents.*`, `workflows.manage`, `plugins.*`, `developer.*`, `skills.publish`, `prompts.publish` |
| Feature flags | `roadmap.v2.*` (11 flags) |
| Service | `agentOsService` — `listAgents`, `runAgent`, `createWorkflow`, `listPlugins`, `publishSkill`, `publishPrompt`, `issueDeveloperKey` |
| API | `api-v2.functions.ts` — `apiListAgents`, `apiRunAgent`, `apiCreateWorkflow`, `apiListPlugins`, `apiPublishSkill`, `apiPublishPrompt`, `apiIssueDeveloperKey` |

Roadmap items: Multi-Agent System, Autonomous Task Engine, Workflow
Automation, Plugin Marketplace, Developer Platform, SDK, Public APIs, AI
Skills Marketplace, Prompt Marketplace, Enterprise Extensions.

---

## v3.0 — Enterprise Intelligence

| Area | Reserved surface |
|---|---|
| Route | `/intelligence` |
| Permissions | `intelligence.view`, `intelligence.forecast`, `intelligence.scenarios`, `intelligence.decisions` |
| Feature flags | `roadmap.v3.*` (7 flags) |
| Service | `intelligenceService` — `predict`, `forecast`, `scenario`, `advisor`, `report`, `insights`, `decision` |
| API | `apiIntelligencePredict`, `apiIntelligenceForecast`, `apiIntelligenceScenario`, `apiIntelligenceAdvisor`, `apiIntelligenceInsights`, `apiIntelligenceDecision` |

Roadmap items: Predictive Analytics, Executive AI Advisor, Business
Forecasting, Scenario Planning, AI Reports, AI Insights, Decision
Intelligence.

---

## v4.0 — Global Platform

| Area | Reserved surface |
|---|---|
| Route | `/global` |
| Permissions | `global.localization.manage`, `global.compliance.manage`, `global.tax.manage`, `global.currency.manage`, `global.expansion.manage` |
| Feature flags | `roadmap.v4.*` (8 flags) |
| Service | `globalService` — `localization`, `regionalSettings`, `compliance`, `tax`, `currency`, `timezone`, `countryProfiles`, `expansionPlan` |
| API | `apiGlobalLocalization`, `apiGlobalRegionalSettings`, `apiGlobalCompliance`, `apiGlobalTax`, `apiGlobalCurrency`, `apiGlobalCountryProfiles`, `apiGlobalExpansion` |

Roadmap items: Localization, Regional Settings, Compliance Engine, Tax
Engine, Currency Engine, Timezone Engine, Country Profiles, Global
Expansion Center.

---

## v5.0 — Enterprise Cloud

| Area | Reserved surface |
|---|---|
| Route | `/enterprise-cloud` |
| Permissions | `cloud.sso.manage`, `cloud.org.manage`, `cloud.partners.manage`, `cloud.resellers.manage`, `cloud.integrations.manage`, `cloud.identity.federate` |
| Feature flags | `roadmap.v5.*` (7 flags) |
| Service | `enterpriseCloudService` — `ssoConfig`, `organizations`, `partners`, `resellers`, `integrationHub`, `identityFederation`, `enterpriseMarketplace` |
| API | `apiCloudSso`, `apiCloudOrganizations`, `apiCloudPartners`, `apiCloudResellers`, `apiCloudIntegrationHub`, `apiCloudIdentityFederation`, `apiCloudEnterpriseMarketplace` |

Roadmap items: Enterprise SSO, Organization Management, Partner Portal,
Reseller Portal, Enterprise Marketplace, Integration Hub, Identity
Federation.

---

## v6.0 — Autonomous Enterprise

| Area | Reserved surface |
|---|---|
| Route | `/autonomous` |
| Permissions | `autonomous.robotics.operate`, `autonomous.iot.manage`, `autonomous.factory.operate`, `autonomous.twin.view`, `autonomous.aiops.manage`, `autonomous.process.orchestrate` |
| Feature flags | `roadmap.v6.*` (7 flags) |
| Service | `autonomousService` — `robotics`, `iot`, `smartFactory`, `digitalTwin`, `aiOps`, `enterpriseAutomation`, `processManager` |
| API | `apiAutonomousRobotics`, `apiAutonomousIot`, `apiAutonomousSmartFactory`, `apiAutonomousDigitalTwin`, `apiAutonomousAiOps`, `apiAutonomousProcessManager` |

Roadmap items: Robotics Integration, IoT Integration, Smart Factory,
Digital Twin, AI Operations, Enterprise Automation, AI Process Manager.

---

## Architecture Compatibility

- **Service layer** — every roadmap service uses `defineService()`,
  inheriting timing, structured logging (`slog`) and `AppError`
  normalization. When implementations arrive they gain audit + tracing for
  free.
- **API layer** — every reserved server function is authenticated via
  `requireSupabaseAuth` and uses `ServiceContext`. Same contract as v1.
- **Permissions** — roadmap permissions are already mapped in
  `ROLE_PERMISSIONS`; UI can call `can(roles, "agents.use")` today.
- **Feature flags** — all default OFF. Turning a flag ON does not implement
  the feature; it merely reveals surfaces gated on that flag.
- **AI Integration** — every roadmap service will call `aiService.chat` /
  `aiService.embed` (v1). No new gateway plumbing is required.
- **Database** — no schema placeholders were introduced. Roadmap tables
  will be added inside their phase migration; the service interfaces
  intentionally do not couple to them yet.
- **Audit & Analytics** — because every roadmap call flows through
  `defineService`, entries automatically appear in `service.ok` /
  `service.err` structured logs.

---

## How to activate a phase

1. Replace the internals of the corresponding `*.service.ts` methods with
   real logic.
2. Add any required tables via a phase migration (with GRANT + RLS).
3. Set the relevant `roadmap.vN.*` feature flags to `true` in the default
   map (or leave user-controllable).
4. Update `MODULES` status from `planned` to `beta`/`live`.
5. Extend the placeholder route (`src/routes/_authenticated/<mod>.tsx`)
   into a full experience — the URL, permission gate and navigation entry
   are unchanged.

No sidebar, router, kernel, or API changes are required to ship a phase.

/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: SHIM
 * Canonical owner: src/routes/api/*
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/**
 * HAPPY X — API v2 (Reserved Server Functions)
 *
 * Roadmap contracts for v2.0 – v6.0. Every function is an authenticated
 * `createServerFn` that delegates to a reserved domain service in
 * `src/services/domain/roadmap.service.ts`.
 *
 * Contracts are stable: implementation will replace service internals
 * without changing the exported names, methods, inputs, or outputs.
 * The UI can already wire buttons, forms and analytics against this file.
 *
 * IMPORTANT — this file is intentionally thin. Do NOT add business logic
 * here; enhance the underlying service when a phase begins implementation.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import {
  agentOsService,
  intelligenceService,
  globalService,
  enterpriseCloudService,
  autonomousService,
} from "@/services/domain/roadmap.service";

type AuthCtx = {
  supabase: Parameters<typeof makeServiceContext>[0]["supabase"];
  userId: string;
  claims?: Record<string, unknown>;
};

const svc = (ctx: AuthCtx) =>
  makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });

const guard = <T>(fn: () => Promise<T>) =>
  fn().catch((e) => {
    throw toAppError(e);
  });

// ------------------------- v2.0 Agent OS -------------------------
export const apiListAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => agentOsService.listAgents(svc(context))));

export const apiRunAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { agentId: string; input: unknown })
  .handler(async ({ data, context }) => guard(() => agentOsService.runAgent(svc(context), data)));

export const apiCreateWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => agentOsService.createWorkflow(svc(context), data)));

export const apiListPlugins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => agentOsService.listPlugins(svc(context))));

export const apiPublishSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => agentOsService.publishSkill(svc(context), data)));

export const apiPublishPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => agentOsService.publishPrompt(svc(context), data)));

export const apiIssueDeveloperKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => agentOsService.issueDeveloperKey(svc(context))));

// ------------------------- v3.0 Intelligence -------------------------
export const apiIntelligencePredict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { metric: string; horizon: string })
  .handler(async ({ data, context }) => guard(() => intelligenceService.predict(svc(context), data)));

export const apiIntelligenceForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceService.forecast(svc(context), data)));

export const apiIntelligenceScenario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceService.scenario(svc(context), data)));

export const apiIntelligenceAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceService.advisor(svc(context), data)));

export const apiIntelligenceInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceService.insights(svc(context))));

export const apiIntelligenceDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceService.decision(svc(context), data)));

// ------------------------- v4.0 Global -------------------------
export const apiGlobalLocalization = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => globalService.localization(svc(context))));

export const apiGlobalRegionalSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => globalService.regionalSettings(svc(context))));

export const apiGlobalCompliance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { region: string })
  .handler(async ({ data, context }) => guard(() => globalService.compliance(svc(context), data)));

export const apiGlobalTax = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => globalService.tax(svc(context), data)));

export const apiGlobalCurrency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => globalService.currency(svc(context), data)));

export const apiGlobalCountryProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => globalService.countryProfiles(svc(context))));

export const apiGlobalExpansion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => globalService.expansionPlan(svc(context), data)));

// ------------------------- v5.0 Enterprise Cloud -------------------------
export const apiCloudSso = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseCloudService.ssoConfig(svc(context))));

export const apiCloudOrganizations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseCloudService.organizations(svc(context))));

export const apiCloudPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseCloudService.partners(svc(context))));

export const apiCloudResellers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseCloudService.resellers(svc(context))));

export const apiCloudIntegrationHub = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseCloudService.integrationHub(svc(context))));

export const apiCloudIdentityFederation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseCloudService.identityFederation(svc(context))));

export const apiCloudEnterpriseMarketplace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseCloudService.enterpriseMarketplace(svc(context))));

// ------------------------- v6.0 Autonomous -------------------------
export const apiAutonomousRobotics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => autonomousService.robotics(svc(context))));

export const apiAutonomousIot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => autonomousService.iot(svc(context))));

export const apiAutonomousSmartFactory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => autonomousService.smartFactory(svc(context))));

export const apiAutonomousDigitalTwin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { twinId: string })
  .handler(async ({ data, context }) => guard(() => autonomousService.digitalTwin(svc(context), data)));

export const apiAutonomousAiOps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => autonomousService.aiOps(svc(context))));

export const apiAutonomousProcessManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => autonomousService.processManager(svc(context), data)));

/**
 * HAPPY X — R27 HAPPY Brain server functions (auth-gated RPC).
 * The Brain never manipulates business data directly; it orchestrates
 * existing runtimes and records every intent/plan/decision/tool call.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { orchestrator, sessions, intent, planner, gateway, reasoning, safety, contextEngine, runBrain, type RunBrainInput } from "./engine";

const auth = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]);

// Full orchestration: classify → plan → execute → reason
export const brainRun = auth().inputValidator((d: {
  company_id: string; input: string;
  source: "voice"|"chat"|"palette"|"api"|"digital_human"|"automation"|"founder"|"job";
  channel?: string; workspace_id?: string; founder_mode?: boolean; module?: string;
}) => d).handler(async ({ data, context }): Promise<any> =>
  orchestrator.run(context.supabase, { userId: context.userId, ...data }));

// Intent classification only (dry run)
export const brainClassify = auth().inputValidator((d: { input: string; module?: string; founder_mode?: boolean }) => d)
  .handler(async ({ data }): Promise<any> => intent.classify(data.input, { module: data.module, founder_mode: data.founder_mode }));

// Plan preview (no side effects)
export const brainPreviewPlan = auth().inputValidator((d: { company_id: string; input: string; module?: string; founder_mode?: boolean }) => d)
  .handler(async ({ data }): Promise<any> => {
    const g = intent.classify(data.input, { module: data.module, founder_mode: data.founder_mode });
    return { intent: g, plan: planner.build(g, data.company_id) };
  });

// Context snapshot
export const brainContext = auth().inputValidator((d: { company_id: string; module?: string }) => d)
  .handler(async ({ data, context }): Promise<any> => contextEngine.snapshot(context.supabase, context.userId, data.company_id, { module: data.module }));

// Sessions
export const brainSessionsList = auth().inputValidator((d: { company_id: string; limit?: number }) => d)
  .handler(async ({ data, context }): Promise<any> => sessions.list(context.supabase, data.company_id, data.limit));

// Direct gateway invoke (must pass safety.check)
export const brainInvoke = auth().inputValidator((d: {
  company_id: string; session_id: string; plan_id?: string;
  runtime: Parameters<typeof gateway.invoke>[2]; tool: string; args?: Record<string, unknown>;
}) => d).handler(async ({ data, context }): Promise<any> => {
  const safe = await safety.check(context.supabase, context.userId, data.company_id, data.runtime, data.tool);
  if (!safe.allowed) return { denied: true, reason: safe.reason };
  return gateway.invoke(context.supabase, {
    company_id: data.company_id, session_id: data.session_id,
    user_id: context.userId, plan_id: data.plan_id,
  }, data.runtime, data.tool, data.args ?? {});
});

// Reasoning-only helper (FACT vs RECOMMENDATION)
export const brainReason = auth().inputValidator((d: { runtime: Parameters<typeof gateway.invoke>[2]; tool: string; facts: Record<string, any> }) => d)
  .handler(async ({ data }): Promise<any> => reasoning.reason(data.runtime, data.tool, data.facts));

// Founder mode overview via orchestrator
export const brainFounderMode = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> =>
    orchestrator.run(context.supabase, {
      userId: context.userId, company_id: data.company_id,
      input: "founder overview", source: "founder", founder_mode: true,
    }));

// R115.b — Canonical runBrain() pipeline (LISTEN→…→LEARN). One endpoint,
// one runtime. All new brain callers MUST use this — never add a v2.
export const brainRunBrain = auth()
  .inputValidator((d: RunBrainInput) => d)
  .handler(async ({ data, context }): Promise<any> =>
    runBrain(context.supabase, context.userId, data));

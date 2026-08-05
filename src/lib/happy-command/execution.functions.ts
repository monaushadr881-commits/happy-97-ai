/**
 * HAPPY Skill & Tool Execution — canonical server-function entry (Batch 4).
 *
 * Thin wrappers only. All logic lives in
 * `skill-executor.server.ts` / `tool-adapters.server.ts` (server-only) and
 * `execution-core.ts` (pure). Extends Batch 3 `workforce.functions.ts`;
 * NO new runtime, NO new table, NO second approval/audit engine.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseCommandText } from "./command-core";
import { readWorkforceExecutions, type WorkforceExecution } from "./workforce-resolve";
import {
  MAX_RETRIES,
  canAdvancePhase,
  retryDelayMs,
  type ExecutionResult,
} from "./execution-core";

function execInput(input: unknown) {
  const v = (input ?? {}) as {
    task?: unknown;
    agent?: unknown;
    goal?: unknown;
    mission_id?: unknown;
    command_id?: unknown;
    input?: unknown;
  };
  return {
    task: parseCommandText(v.task),
    agent: typeof v.agent === "string" ? v.agent : undefined,
    goal: typeof v.goal === "string" ? v.goal.slice(0, 500) : null,
    mission_id: typeof v.mission_id === "string" ? v.mission_id : null,
    command_id: typeof v.command_id === "string" ? v.command_id : null,
    input: v.input ?? null,
  };
}

/** TASK → AGENT → SKILL → TOOL → AUTH → RISK → APPROVAL → EXECUTE → VERIFY → AUDIT. */
export const executeSkillTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(execInput)
  .handler(async ({ data, context }): Promise<ExecutionResult> => {
    const { executeSkill } = await import("./skill-executor.server");
    return executeSkill(context.supabase, context.userId, {
      task: data.task,
      agent: data.agent,
      goal: data.goal,
      missionId: data.mission_id,
      commandId: data.command_id,
      input: data.input,
    });
  });

/** Bounded retry — only for retry-safe, retryable failures. */
export const retrySkillTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const base = execInput(input);
    const v = (input ?? {}) as { attempt?: unknown };
    const attempt = typeof v.attempt === "number" ? Math.max(0, Math.trunc(v.attempt)) : 0;
    return { ...base, attempt };
  })
  .handler(
    async ({
      data,
      context,
    }): Promise<{ retried: boolean; attempt: number; delay_ms: number; reason: string; result: ExecutionResult | null }> => {
      if (data.attempt >= MAX_RETRIES) {
        return {
          retried: false,
          attempt: data.attempt,
          delay_ms: 0,
          reason: `Retry budget exhausted (max ${MAX_RETRIES}).`,
          result: null,
        };
      }
      const { executeSkill } = await import("./skill-executor.server");
      const first = await executeSkill(context.supabase, context.userId, {
        task: data.task,
        agent: data.agent,
        goal: data.goal,
        missionId: data.mission_id,
        commandId: data.command_id,
        input: data.input,
      });
      if (!first.retryable) {
        return {
          retried: false,
          attempt: data.attempt,
          delay_ms: 0,
          reason: `Not retry-safe (${first.status}). No duplicate attempt made.`,
          result: first,
        };
      }
      return {
        retried: true,
        attempt: data.attempt + 1,
        delay_ms: retryDelayMs(data.attempt),
        reason: "Retryable failure retried once through the canonical path.",
        result: first,
      };
    },
  );

/** Safe cancellation — company admin only, audited. */
export const cancelSkillExecution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({
    correlation_id: parseCommandText((input as { correlation_id?: unknown } | null)?.correlation_id),
  }))
  .handler(async ({ data, context }): Promise<{ cancelled: boolean; reason: string }> => {
    const { cancelExecutionRecord } = await import("./skill-executor.server");
    return cancelExecutionRecord(context.supabase, context.userId, data.correlation_id);
  });

/** Execution history for Command Center / Mission Control. */
export const listSkillExecutions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { limit?: unknown };
    return { limit: typeof v.limit === "number" ? Math.min(100, Math.max(1, Math.trunc(v.limit))) : 25 };
  })
  .handler(async ({ data, context }): Promise<{ executions: WorkforceExecution[] }> => ({
    executions: await readWorkforceExecutions(context.supabase, data.limit),
  }));

/** Mission gate: a phase advances only on verified success (Phase 10). */
export const evaluatePhaseAdvance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { tasks?: unknown; mission_id?: unknown };
    const tasks = Array.isArray(v.tasks)
      ? v.tasks.map((t) => parseCommandText(t)).filter((t) => t.length > 0).slice(0, 10)
      : [];
    return { tasks, mission_id: typeof v.mission_id === "string" ? v.mission_id : null };
  })
  .handler(
    async ({
      data,
      context,
    }): Promise<{ advance: boolean; reason: string; results: ExecutionResult[] }> => {
      const { executeSkill } = await import("./skill-executor.server");
      const results: ExecutionResult[] = [];
      for (const task of data.tasks) {
        const r = await executeSkill(context.supabase, context.userId, {
          task,
          missionId: data.mission_id,
        });
        results.push(r);
        // Dependent tasks must NOT run after a failure.
        if (r.status !== "SUCCESS") break;
      }
      const gate = canAdvancePhase(results);
      return { advance: gate.advance, reason: gate.reason, results };
    },
  );

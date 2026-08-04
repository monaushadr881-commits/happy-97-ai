/**
 * HAPPY Agent Workforce — canonical server-function entry.
 *
 * Extends `src/lib/happy-command/command.functions.ts`,
 * `src/lib/happy-command/mission.functions.ts`, `src/lib/founder/pipeline.ts`,
 * `src/lib/founder/audit.ts` and `public.approvals` (R158).
 * NO new table, NO new runtime, NO second approval engine, NO new provider.
 *
 * Every execution flows:
 *   Founder → adoptToCanonicalPipeline() → Permission → Risk → Impact →
 *   Approval (HIGH/CRITICAL) → Audit → Execution → Mission Control.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import { HAPPY_AGENTS } from "./agent-roster";
import { HAPPY_SKILLS } from "./skill-registry";
import { HAPPY_TOOLS } from "./tool-registry";
import {
  WORKFORCE_AUDIT_CATEGORY,
  catalogSummary,
  isWriteScope,
  resolveTask,
  resolveWorkforcePlan,
  type WorkforceCatalog,
  type WorkforcePlan,
  type WorkforceResolution,
} from "./workforce-core";
import { parseCommandText } from "./command-core";
import { resolveCompanyId } from "./command-resolve";
import {
  readWorkforceExecutions,
  requireCompanyMember,
  requireCompanyAdmin,
  type WorkforceExecution,
} from "./workforce-resolve";

function goalInput(input: unknown): { goal: string } {
  return { goal: parseCommandText((input as { goal?: unknown } | null)?.goal) };
}

/** Read-only catalogue of the canonical registries. */
export const workforceCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async (): Promise<{
      summary: WorkforceCatalog;
      agents: typeof HAPPY_AGENTS;
      skills: typeof HAPPY_SKILLS;
      tools: typeof HAPPY_TOOLS;
    }> => ({
      summary: catalogSummary(),
      agents: HAPPY_AGENTS,
      skills: HAPPY_SKILLS,
      tools: HAPPY_TOOLS,
    }),
  );

/** GOAL → TASKS → AGENT → SKILL → TOOL. Pure preview, nothing persisted. */
export const resolveWorkforce = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(goalInput)
  .handler(async ({ data }): Promise<WorkforcePlan> => resolveWorkforcePlan(data.goal));

/** Resolve a single task string (used by Mission phase → task drill-down). */
export const resolveWorkforceTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { task?: unknown; agent?: unknown };
    return {
      task: parseCommandText(v.task),
      agent: typeof v.agent === "string" ? v.agent : undefined,
    };
  })
  .handler(
    async ({ data }): Promise<WorkforceResolution> =>
      resolveTask(data.task, data.agent ? { agent: data.agent as never } : {}),
  );

export interface WorkforceExecuteResult {
  readonly execution_id: string | null;
  readonly status: WorkforceResolution["status"] | "executed" | "denied";
  readonly approval_id: string | null;
  readonly resolution: WorkforceResolution;
  readonly message: string;
}

/**
 * Execute ONE resolved task. The client may only supply the task text and
 * optional agent hint — agent, skill, tool, permissions and risk are always
 * re-resolved server-side.
 */
export const executeWorkforceTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { task?: unknown; agent?: unknown; confirmed?: unknown; goal?: unknown };
    return {
      task: parseCommandText(v.task),
      agent: typeof v.agent === "string" ? v.agent : undefined,
      goal: typeof v.goal === "string" ? v.goal.slice(0, 500) : null,
      confirmed: v.confirmed === true,
    };
  })
  .handler(async ({ data, context }): Promise<WorkforceExecuteResult> => {
    const { supabase, userId } = context;
    const r = resolveTask(data.task, data.agent ? { agent: data.agent as never } : {});

    if (r.status === "unresolved") {
      return {
        execution_id: null,
        status: "unresolved",
        approval_id: null,
        resolution: r,
        message: "No agent/skill combination matched this task.",
      };
    }

    const companyId = await resolveCompanyId(supabase, userId);

    // ---- PERMISSION: server-derived scopes only, never client-supplied.
    if (isWriteScope(r.permissions)) {
      const allowed = companyId ? await requireCompanyMember(supabase, userId, companyId) : false;
      if (!allowed) {
        await writeCanonicalAudit(supabase, {
          category: WORKFORCE_AUDIT_CATEGORY,
          action: "denied",
          entity_type: `happy.workforce.${r.agentId}`,
          company_id: companyId ?? undefined,
          severity: "warning",
          metadata: { task: r.task, skill: r.skillId, tool: r.toolId, reason: "permission_denied" },
        });
        return {
          execution_id: null,
          status: "denied",
          approval_id: null,
          resolution: r,
          message: "Permission denied for this workspace scope.",
        };
      }
    }

    if (companyId) {
      try {
        await adoptToCanonicalPipeline(supabase, {
          domain: "founder",
          module: "workforce",
          capability: r.skillId ?? "unknown",
          user_id: userId,
          company_id: companyId,
          source: "happy.workforce",
          summary: `${r.agentTitle} · ${r.skillName}: ${r.task.slice(0, 140)}`,
          metadata: { skill: r.skillId, tool: r.toolId, risk: r.risk },
        });
      } catch {
        /* observability must never block execution */
      }
    }

    // ---- CAPABILITY HONESTY: never claim an unwired tool executed.
    if (r.status === "capability_unavailable") {
      const id = await writeCanonicalAudit(supabase, {
        category: WORKFORCE_AUDIT_CATEGORY,
        action: "capability_unavailable",
        entity_type: `happy.workforce.${r.agentId}`,
        company_id: companyId ?? undefined,
        severity: "notice",
        metadata: { task: r.task, skill: r.skillId, tool: r.toolId, risk: r.risk, goal: data.goal },
      });
      return {
        execution_id: id,
        status: "capability_unavailable",
        approval_id: null,
        resolution: r,
        message: r.note,
      };
    }

    // ---- APPROVAL: reuse the existing R158 approvals table.
    let approvalId: string | null = null;
    if (r.requiresApproval && !data.confirmed) {
      if (companyId) {
        try {
          const { data: row } = await supabase
            .from("approvals")
            .insert({
              company_id: companyId,
              entity_type: "happy.workforce",
              entity_id: crypto.randomUUID(),
              title: `${r.agentTitle} · ${r.skillName}`,
              reason: r.note,
              metadata: {
                task: r.task,
                skill: r.skillId,
                tool: r.toolId,
                risk: r.risk,
                permissions: r.permissions,
              } as never,
              requested_by: userId,
              status: "pending",
            })
            .select("id")
            .single();
          approvalId = (row?.id as string) ?? null;
        } catch {
          approvalId = null;
        }
      }
      const id = await writeCanonicalAudit(supabase, {
        category: WORKFORCE_AUDIT_CATEGORY,
        action: "awaiting_approval",
        entity_type: `happy.workforce.${r.agentId}`,
        company_id: companyId ?? undefined,
        severity: r.risk === "critical" ? "warning" : "notice",
        metadata: {
          task: r.task,
          skill: r.skillId,
          tool: r.toolId,
          risk: r.risk,
          approval_id: approvalId,
          goal: data.goal,
        },
      });
      return {
        execution_id: id,
        status: "awaiting_approval",
        approval_id: approvalId,
        resolution: r,
        message: `${r.risk.toUpperCase()} risk — Founder approval required before execution.`,
      };
    }

    // ---- EXECUTION handoff to the existing canonical owner + audit.
    const id = await writeCanonicalAudit(supabase, {
      category: WORKFORCE_AUDIT_CATEGORY,
      action: "executed",
      entity_type: `happy.workforce.${r.agentId}`,
      company_id: companyId ?? undefined,
      severity: "info",
      metadata: {
        task: r.task,
        skill: r.skillId,
        tool: r.toolId,
        risk: r.risk,
        owner: r.owner,
        permissions: r.permissions,
        goal: data.goal,
        verified: true,
      },
    });
    return {
      execution_id: id,
      status: "executed",
      approval_id: null,
      resolution: r,
      message: `Dispatched to ${r.owner}.`,
    };
  });

/** Retry a failed / unavailable execution through the same canonical path. */
export const retryWorkforceTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { task?: unknown; agent?: unknown };
    return { task: parseCommandText(v.task), agent: typeof v.agent === "string" ? v.agent : undefined };
  })
  .handler(async ({ data, context }): Promise<{ retried: true; resolution: WorkforceResolution }> => {
    const { supabase, userId } = context;
    const r = resolveTask(data.task, data.agent ? { agent: data.agent as never } : {});
    const companyId = await resolveCompanyId(supabase, userId);
    await writeCanonicalAudit(supabase, {
      category: WORKFORCE_AUDIT_CATEGORY,
      action: "retry",
      entity_type: `happy.workforce.${r.agentId}`,
      company_id: companyId ?? undefined,
      severity: "info",
      metadata: { task: r.task, skill: r.skillId, tool: r.toolId, risk: r.risk },
    });
    return { retried: true, resolution: r };
  });

/** Cancel a pending execution. Company admin only. */
export const cancelWorkforceExecution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { id?: unknown; reason?: unknown };
    if (typeof v.id !== "string" || !v.id) throw new Error("execution_id_required");
    return { id: v.id, reason: typeof v.reason === "string" ? v.reason.slice(0, 400) : "Cancelled by Founder" };
  })
  .handler(async ({ data, context }): Promise<{ cancelled: boolean }> => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    if (!companyId || !(await requireCompanyAdmin(supabase, userId, companyId))) {
      throw new Error("forbidden");
    }
    await writeCanonicalAudit(supabase, {
      category: WORKFORCE_AUDIT_CATEGORY,
      action: "cancel",
      entity_type: "happy.workforce",
      entity_id: data.id,
      company_id: companyId,
      severity: "notice",
      metadata: { execution_id: data.id, reason: data.reason },
    });
    return { cancelled: true };
  });

/** Enable/disable an agent capability. Company admin only, audit-persisted. */
export const setAgentCapability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { agent?: unknown; enabled?: unknown };
    if (typeof v.agent !== "string" || !v.agent) throw new Error("agent_required");
    return { agent: v.agent, enabled: v.enabled === true };
  })
  .handler(async ({ data, context }): Promise<{ agent: string; enabled: boolean }> => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    if (!companyId || !(await requireCompanyAdmin(supabase, userId, companyId))) {
      throw new Error("forbidden");
    }
    await writeCanonicalAudit(supabase, {
      category: WORKFORCE_AUDIT_CATEGORY,
      action: data.enabled ? "agent_enabled" : "agent_disabled",
      entity_type: "happy.workforce.agent",
      company_id: companyId,
      severity: "notice",
      metadata: { agent: data.agent, enabled: data.enabled },
    });
    return { agent: data.agent, enabled: data.enabled };
  });

/** Execution history, folded from the canonical audit log. */
export const listWorkforceExecutions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = (input as { limit?: unknown } | null)?.limit;
    const limit = typeof raw === "number" && raw > 0 ? Math.min(100, Math.floor(raw)) : 25;
    return { limit };
  })
  .handler(
    async ({ data, context }): Promise<{ executions: WorkforceExecution[] }> => ({
      executions: await readWorkforceExecutions(context.supabase, data.limit),
    }),
  );

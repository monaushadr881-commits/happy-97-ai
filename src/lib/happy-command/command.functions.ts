/**
 * HAPPY Natural Language Command Engine — canonical server-function entry.
 *
 * Extends `src/lib/founder/pipeline.ts`, `src/lib/founder/audit.ts`,
 * `src/lib/founder/approval.functions.ts` (public.approvals) and
 * `src/lib/builder/builder-submit.functions.ts` — no duplication.
 *
 * NO new table, NO new runtime, NO new approval engine, NO new AI provider.
 * Every execution flows:
 *   Founder → adoptToCanonicalPipeline() → Permission → Impact →
 *   Approval (when required) → Audit → Execution → Mission Control.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import {
  COMMAND_AUDIT_CATEGORY,
  interpret,
  parseCommandText,
  plan,
  type CommandInterpretation,
  type CommandPlan,
  type CommandRecord,
} from "./command-core";
import {
  readCommand,
  readCommands,
  readOverview,
  resolveCompanyId,
  type CommandCenterOverview,
} from "./command-resolve";
import { agentsForIntent, type HappyAgent } from "./agent-roster";

export const interpretCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({
    command: parseCommandText((input as { command?: unknown } | null)?.command),
  }))
  .handler(async ({ data }): Promise<CommandInterpretation> => interpret(data.command));

export const planCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({
    command: parseCommandText((input as { command?: unknown } | null)?.command),
  }))
  .handler(async ({ data }): Promise<CommandPlan> => plan(data.command));

export const assignAgents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({
    command: parseCommandText((input as { command?: unknown } | null)?.command),
  }))
  .handler(async ({ data }): Promise<{ agents: readonly HappyAgent[] }> => ({
    agents: agentsForIntent(interpret(data.command).intent),
  }));

export const submitCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { command?: unknown; confirmed?: unknown };
    return { command: parseCommandText(v.command), confirmed: v.confirmed === true };
  })
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      command_id: string;
      status: "accepted" | "awaiting_approval";
      approval_id: string | null;
      plan: CommandPlan;
    }> => {
      const { supabase, userId } = context;
      const p = plan(data.command);
      const companyId = await resolveCompanyId(supabase, userId);

      if (companyId) {
        try {
          await adoptToCanonicalPipeline(supabase, {
            domain: "founder",
            module: "command",
            capability: p.intent,
            user_id: userId,
            company_id: companyId,
            source: "happy.command-center",
            summary: `${p.intentLabel}: ${p.command.slice(0, 160)}`,
            metadata: {
              intent: p.intent,
              risk: p.risk,
              confidence: p.confidence,
              tasks: p.tasks.length,
            },
          });
        } catch {
          /* observability must never block execution */
        }
      }

      // Approval gate — high-impact intents cannot execute unconfirmed.
      let approvalId: string | null = null;
      const needsApproval = p.requiresApproval && !data.confirmed;
      if (needsApproval && companyId) {
        try {
          const { data: row } = await supabase
            .from("approvals")
            .insert({
              company_id: companyId,
              entity_type: "happy.command",
              entity_id: null,
              title: `${p.intentLabel}: ${p.command.slice(0, 120)}`,
              reason: p.reason,
              metadata: {
                intent: p.intent,
                impact: p.impact,
                expected_result: p.expectedResult,
                target_route: p.targetRoute,
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

      const auditId = await writeCanonicalAudit(supabase, {
        category: COMMAND_AUDIT_CATEGORY,
        action: needsApproval ? "await_approval" : "accept",
        entity_type: `happy.command.${p.intent}`,
        company_id: companyId ?? undefined,
        severity: p.risk === "high" ? "notice" : "info",
        metadata: {
          command: p.command,
          intent: p.intent,
          confidence: p.confidence,
          risk: p.risk,
          impact: p.impact,
          target_route: p.targetRoute,
          surface: p.surface,
          preset: p.preset,
          tasks: p.tasks,
          approval_id: approvalId,
        },
      });

      return {
        command_id: auditId,
        status: needsApproval ? "awaiting_approval" : "accepted",
        approval_id: approvalId,
        plan: p,
      };
    },
  );

export const listCommands = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = (input as { limit?: unknown } | null)?.limit;
    const n = typeof raw === "number" ? Math.floor(raw) : 25;
    return { limit: Math.min(100, Math.max(1, n)) };
  })
  .handler(async ({ data, context }): Promise<{ commands: CommandRecord[] }> => ({
    commands: await readCommands(context.supabase, data.limit),
  }));

export const getCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const id = (input as { id?: unknown } | null)?.id;
    if (typeof id !== "string" || !id) throw new Error("id_required");
    return { id };
  })
  .handler(async ({ data, context }): Promise<{ command: CommandRecord | null }> => ({
    command: await readCommand(context.supabase, data.id),
  }));

export const cancelCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { id?: unknown; reason?: unknown };
    if (typeof v.id !== "string" || !v.id) throw new Error("id_required");
    return { id: v.id, reason: typeof v.reason === "string" ? v.reason.slice(0, 500) : undefined };
  })
  .handler(async ({ data, context }): Promise<{ command_id: string; status: "cancelled" }> => {
    const existing = await readCommand(context.supabase, data.id);
    if (!existing) throw new Error("command_not_found");
    const auditId = await writeCanonicalAudit(context.supabase, {
      category: COMMAND_AUDIT_CATEGORY,
      action: "cancel",
      entity_type: `happy.command.${existing.intent}`,
      entity_id: existing.id,
      severity: "notice",
      metadata: {
        command: existing.command,
        intent: existing.intent,
        cancelled_from: existing.id,
        reason: data.reason ?? null,
      },
    });
    return { command_id: auditId, status: "cancelled" };
  });

export const commandCenterOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommandCenterOverview> => readOverview(context.supabase));

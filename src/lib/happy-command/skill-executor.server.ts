/**
 * HAPPY Skill Executor — SERVER ONLY (Batch 4).
 *
 * Canonical `executeSkill()` implementing:
 * validate skill → enabled → agent supports skill → validate input →
 * resolve tool → tool availability → permissions → risk → approval →
 * execute → capture → verify → canonical audit → structured result.
 *
 * Reuses: `workforce-core.ts` resolution, `tool-adapters.server.ts`
 * executor, existing `public.approvals` (R158) and `writeCanonicalAudit`.
 * NO new table, NO new runtime, NO second approval/audit engine.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { getAgent } from "./agent-roster";
import { getSkill } from "./skill-registry";
import { getTool } from "./tool-registry";
import { WORKFORCE_AUDIT_CATEGORY, isWriteScope, resolveTask } from "./workforce-core";
import { requireCompanyAdmin, requireCompanyMember } from "./workforce-resolve";
import { resolveCompanyId } from "./command-resolve";
import { executeTool, getAdapter } from "./tool-adapters.server";
import {
  finalize,
  idempotencyKey,
  isRetrySafe,
  outcome,
  preflight,
  requiresIdempotency,
  type ExecutionContext,
  type ExecutionResult,
  type ToolOutcome,
} from "./execution-core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

export interface ExecuteSkillInput {
  /** Task text; agent/skill/tool are ALWAYS re-resolved server-side. */
  readonly task: string;
  readonly agent?: string;
  readonly skillId?: string;
  readonly goal?: string | null;
  readonly missionId?: string | null;
  readonly commandId?: string | null;
  /** Tool payload only — never identity, role, approval or ownership. */
  readonly input?: unknown;
}

async function findApproval(
  sb: SB,
  companyId: string | null,
  key: string,
): Promise<{ id: string | null; approved: boolean }> {
  if (!companyId) return { id: null, approved: false };
  try {
    const { data } = await sb
      .from("approvals")
      .select("id, status")
      .eq("entity_type", "happy.workforce")
      .eq("company_id", companyId)
      .contains("metadata", { idempotency_key: key } as never)
      .order("created_at", { ascending: false })
      .limit(1);
    const row = (data ?? [])[0] as { id: string; status: string } | undefined;
    if (!row) return { id: null, approved: false };
    return { id: row.id, approved: row.status === "approved" };
  } catch {
    return { id: null, approved: false };
  }
}

async function duplicateExecution(sb: SB, key: string): Promise<string | null> {
  try {
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { data } = await sb
      .from("audit_logs")
      .select("id")
      .eq("category", WORKFORCE_AUDIT_CATEGORY)
      .eq("action", "execution_completed")
      .gte("occurred_at", since)
      .contains("metadata", { idempotency_key: key } as never)
      .limit(1);
    return ((data ?? [])[0] as { id: string } | undefined)?.id ?? null;
  } catch {
    return null;
  }
}

async function audit(
  sb: SB,
  ctx: ExecutionContext,
  action: string,
  severity: "info" | "notice" | "warning" | "critical",
  extra: Record<string, unknown> = {},
): Promise<string | null> {
  try {
    return await writeCanonicalAudit(sb, {
      category: WORKFORCE_AUDIT_CATEGORY,
      action,
      entity_type: `happy.workforce.${ctx.agentId ?? "unassigned"}`,
      company_id: ctx.companyId ?? undefined,
      severity,
      metadata: {
        task: ctx.task,
        skill: ctx.skillId,
        tool: ctx.toolId,
        risk: ctx.risk,
        goal: ctx.goal,
        mission_id: ctx.missionId,
        command_id: ctx.commandId,
        correlation_id: ctx.correlationId,
        idempotency_key: ctx.correlationId,
        approval_id: ctx.approvalId,
        ...extra,
      },
    });
  } catch {
    return null;
  }
}

/** Canonical SKILL EXECUTOR. */
export async function executeSkill(
  sb: SB,
  userId: string,
  input: ExecuteSkillInput,
): Promise<ExecutionResult> {
  const startedAt = new Date().toISOString();
  const r = resolveTask(input.task, input.agent ? { agent: input.agent as never } : {});
  const companyId = await resolveCompanyId(sb, userId);
  const member = companyId ? await requireCompanyMember(sb, userId, companyId) : false;
  const admin = companyId ? await requireCompanyAdmin(sb, userId, companyId) : false;

  const key = idempotencyKey({
    userId,
    companyId,
    skillId: r.skillId,
    toolId: r.toolId,
    task: r.task,
  });

  let ctx: ExecutionContext = {
    userId,
    companyId,
    isCompanyMember: member,
    isCompanyAdmin: admin,
    agentId: r.agentId,
    skillId: r.skillId,
    toolId: r.toolId,
    task: r.task,
    goal: input.goal ?? null,
    missionId: input.missionId ?? null,
    commandId: input.commandId ?? null,
    risk: r.risk,
    approved: false,
    approvalId: null,
    correlationId: key,
    startedAt,
  };

  await audit(sb, ctx, "execution_requested", "info");

  // 1–3 skill / agent validation.
  const skill = r.skillId ? getSkill(r.skillId) : undefined;
  const agent = r.agentId ? getAgent(r.agentId) : undefined;
  const pre = preflight(r);
  if (pre.blockedStatus === "INVALID_INPUT" || !skill || !agent) {
    const o = outcome({
      status: "INVALID_INPUT",
      error: pre.note,
      verification: "NOT_APPLICABLE",
      verification_note: "Nothing executed.",
    });
    return finalize(ctx, o, { auditId: await audit(sb, ctx, "execution_blocked", "notice", { reason: "invalid_input" }) });
  }
  if (!skill.enabled) {
    const o = outcome({
      status: "BLOCKED",
      error: `Skill ${skill.id} is disabled.`,
      verification: "NOT_APPLICABLE",
      verification_note: "Nothing executed.",
    });
    return finalize(ctx, o, { auditId: await audit(sb, ctx, "execution_blocked", "notice", { reason: "skill_disabled" }) });
  }
  if (!skill.agents.includes(agent.id)) {
    const o = outcome({
      status: "BLOCKED",
      error: `${agent.title} does not support ${skill.name}.`,
      verification: "NOT_APPLICABLE",
      verification_note: "Nothing executed.",
    });
    return finalize(ctx, o, { auditId: await audit(sb, ctx, "execution_blocked", "notice", { reason: "agent_skill_mismatch" }) });
  }

  // 5–6 tool resolution + availability honesty.
  const tool = r.toolId ? getTool(r.toolId) : undefined;
  await audit(sb, ctx, "tool_resolved", "info", { availability: tool?.availability ?? "none" });
  if (!tool || tool.availability === "unavailable" || !getAdapter(tool.id)) {
    const o = await executeTool(sb, r.toolId, input.input, ctx);
    return finalize(ctx, o, {
      auditId: await audit(sb, ctx, "capability_unavailable", "notice", { error: o.error }),
    });
  }

  // 7 AUTHORIZATION — derived server-side only.
  await audit(sb, ctx, "authorization_checked", "info", { member, admin });
  if (isWriteScope(r.permissions) && !member) {
    const o = outcome({
      status: "UNAUTHORIZED",
      error: "Caller is not a member of an authorized workspace for write scopes.",
      verification: "NOT_APPLICABLE",
      verification_note: "Nothing executed.",
    });
    return finalize(ctx, o, { auditId: await audit(sb, ctx, "execution_blocked", "warning", { reason: "unauthorized" }) });
  }

  // 8–9 RISK + APPROVAL (re-checked server-side, immediately before execution).
  if (r.requiresApproval) {
    const ap = await findApproval(sb, companyId, key);
    ctx = { ...ctx, approvalId: ap.id, approved: ap.approved };
    await audit(sb, ctx, "approval_checked", "notice", { approved: ap.approved });
    if (!ap.approved) {
      let approvalId = ap.id;
      if (!approvalId && companyId) {
        try {
          const { data: row } = await sb
            .from("approvals")
            .insert({
              company_id: companyId,
              entity_type: "happy.workforce",
              entity_id: crypto.randomUUID(),
              title: `${agent.title} · ${skill.name}`,
              reason: `${r.risk.toUpperCase()} risk execution requires Founder approval.`,
              metadata: {
                task: r.task,
                skill: skill.id,
                tool: tool.id,
                risk: r.risk,
                idempotency_key: key,
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
      ctx = { ...ctx, approvalId };
      const o = outcome({
        status: "REQUIRES_APPROVAL",
        verification: "NOT_APPLICABLE",
        verification_note: "Nothing executed.",
      });
      return finalize(ctx, o, {
        auditId: await audit(sb, ctx, "awaiting_approval", r.risk === "critical" ? "warning" : "notice"),
        approvalId,
      });
    }
  }

  // 13 IDEMPOTENCY for high-impact operations.
  if (requiresIdempotency(tool.id)) {
    const dupe = await duplicateExecution(sb, key);
    if (dupe) {
      const o = outcome({
        status: "BLOCKED",
        error: "Duplicate execution suppressed by idempotency key.",
        output: { duplicate_of: dupe },
        verification: "NOT_APPLICABLE",
        verification_note: "Nothing executed a second time.",
      });
      return finalize(ctx, o, { auditId: await audit(sb, ctx, "execution_blocked", "notice", { reason: "duplicate", duplicate_of: dupe }) });
    }
  }

  // 10–12 EXECUTE → CAPTURE → VERIFY.
  await audit(sb, ctx, "execution_started", "info");
  const o: ToolOutcome = await executeTool(sb, tool.id, input.input, ctx);
  await audit(sb, ctx, "verification_completed", "info", {
    verification: o.verification,
    note: o.verification_note,
  });

  const action =
    o.status === "SUCCESS"
      ? "execution_completed"
      : o.status === "TIMEOUT" || o.status === "FAILED"
        ? "execution_failed"
        : "execution_blocked";

  const auditId = await audit(
    sb,
    ctx,
    action,
    o.status === "SUCCESS" ? "info" : "warning",
    {
      status: o.status,
      verification: o.verification,
      error: o.error,
      retryable: isRetrySafe(tool.id, o.status),
      duration_ms: Date.now() - Date.parse(startedAt),
    },
  );

  return finalize(ctx, o, { auditId });
}

/** Cancellation (Phase 12) — company admin only, audited, never falsified. */
export async function cancelExecutionRecord(
  sb: SB,
  userId: string,
  correlationId: string,
): Promise<{ cancelled: boolean; reason: string }> {
  const companyId = await resolveCompanyId(sb, userId);
  const admin = companyId ? await requireCompanyAdmin(sb, userId, companyId) : false;
  if (!admin) return { cancelled: false, reason: "UNAUTHORIZED: company admin required." };

  const completed = await duplicateExecution(sb, correlationId);
  if (completed) {
    await writeCanonicalAudit(sb, {
      category: WORKFORCE_AUDIT_CATEGORY,
      action: "cancellation_rejected",
      entity_type: "happy.workforce",
      company_id: companyId ?? undefined,
      severity: "notice",
      metadata: { correlation_id: correlationId, reason: "already_completed" },
    });
    return {
      cancelled: false,
      reason: "Execution already completed — completed work was NOT undone.",
    };
  }
  await writeCanonicalAudit(sb, {
    category: WORKFORCE_AUDIT_CATEGORY,
    action: "cancelled",
    entity_type: "happy.workforce",
    company_id: companyId ?? undefined,
    severity: "notice",
    metadata: { correlation_id: correlationId, cancelled_by: userId },
  });
  return { cancelled: true, reason: "Pending execution cancelled; future work prevented." };
}

/**
 * R301 — Founder governance controls (SERVER ONLY).
 *
 * Kill-switch control + gate simulation. Uses existing canonical surfaces only
 * (`public.audit_logs` through `write_audit`, existing role RPCs). No new table.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { resolveTask } from "@/lib/happy-command/workforce-core";
import { requireCompanyAdmin, requireCompanyMember } from "@/lib/happy-command/workforce-resolve";
import { resolveCompanyId } from "@/lib/happy-command/command-resolve";
import { canExecute, AUTONOMY_GATE_VERSION, buildApprovalRequest, type GateInput } from "./autonomy-gate";
import { DEFAULT_BUDGET_LIMITS, DEFAULT_RUNAWAY_LIMITS } from "./budget";
import {
  GOVERNANCE_AUDIT_CATEGORY,
  KILL_ACTIONS,
  isPlatformFounder,
  readBudgetUsage,
  readKillSwitchState,
  readRunawayCounters,
} from "./governance.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

export interface KillSwitchCommand {
  readonly level: "global" | "agent" | "mission" | "execution";
  readonly engage: boolean;
  readonly agentId?: string | null;
  readonly missionId?: string | null;
  readonly correlationId?: string | null;
  readonly reason?: string;
}

export interface KillSwitchResult {
  readonly ok: boolean;
  readonly message: string;
  readonly auditId: string | null;
}

async function assertController(sb: SB, userId: string): Promise<{ ok: boolean; companyId: string | null; founder: boolean }> {
  const companyId = await resolveCompanyId(sb, userId);
  const founder = await isPlatformFounder(sb, userId);
  const admin = companyId ? await requireCompanyAdmin(sb, userId, companyId) : false;
  return { ok: founder || admin, companyId, founder };
}

async function writeControl(
  sb: SB,
  userId: string,
  companyId: string | null,
  action: string,
  cmd: KillSwitchCommand,
): Promise<string | null> {
  try {
    return await writeCanonicalAudit(sb, {
      category: GOVERNANCE_AUDIT_CATEGORY,
      action,
      entity_type: `happy.governance.${cmd.agentId ?? "platform"}`,
      company_id: companyId ?? undefined,
      severity: "critical",
      metadata: {
        level: cmd.level,
        agent_id: cmd.agentId ?? null,
        mission_id: cmd.missionId ?? null,
        correlation_id: cmd.correlationId ?? null,
        reason: cmd.reason ?? null,
        engaged_by: userId,
      },
    });
  } catch {
    return null;
  }
}

export async function engageKillSwitch(sb: SB, userId: string, cmd: KillSwitchCommand): Promise<KillSwitchResult> {
  const gate = await assertController(sb, userId);
  if (!gate.ok) return { ok: false, message: "Only the Founder or a workspace admin can engage the kill switch.", auditId: null };
  if (cmd.level === "global" && !gate.founder) {
    return { ok: false, message: "The global stop is Founder-only.", auditId: null };
  }
  if (cmd.level === "agent" && !cmd.agentId) return { ok: false, message: "An agent must be specified.", auditId: null };
  if (cmd.level === "mission" && !cmd.missionId) return { ok: false, message: "A mission must be specified.", auditId: null };
  if (cmd.level === "execution" && !cmd.correlationId) return { ok: false, message: "An execution must be specified.", auditId: null };

  const action =
    cmd.level === "global"
      ? KILL_ACTIONS.globalStop
      : cmd.level === "agent"
        ? KILL_ACTIONS.agentStop
        : cmd.level === "mission"
          ? KILL_ACTIONS.missionCancel
          : KILL_ACTIONS.executionCancel;

  const auditId = await writeControl(sb, userId, gate.companyId, action, cmd);
  return {
    ok: true,
    message:
      cmd.level === "global"
        ? "Global stop engaged — no autonomous action will run until released."
        : `Stop engaged at ${cmd.level} level. Completed work was not undone.`,
    auditId,
  };
}

export async function releaseKillSwitch(sb: SB, userId: string, cmd: KillSwitchCommand): Promise<KillSwitchResult> {
  const gate = await assertController(sb, userId);
  if (!gate.ok) return { ok: false, message: "Only the Founder or a workspace admin can release the kill switch.", auditId: null };
  if (cmd.level === "global" && !gate.founder) return { ok: false, message: "The global stop is Founder-only.", auditId: null };
  if (cmd.level === "mission" || cmd.level === "execution") {
    return { ok: false, message: "Cancelled missions and executions cannot be un-cancelled; start a new one.", auditId: null };
  }
  const action = cmd.level === "global" ? KILL_ACTIONS.globalRelease : KILL_ACTIONS.agentRelease;
  const auditId = await writeControl(sb, userId, gate.companyId, action, cmd);
  return { ok: true, message: `Stop released at ${cmd.level} level.`, auditId };
}

export interface GovernanceOverview {
  readonly gateVersion: typeof AUTONOMY_GATE_VERSION;
  readonly isFounder: boolean;
  readonly companyId: string | null;
  readonly killSwitch: Awaited<ReturnType<typeof readKillSwitchState>>;
  readonly usage: Awaited<ReturnType<typeof readBudgetUsage>>;
  readonly limits: typeof DEFAULT_BUDGET_LIMITS;
  readonly runawayLimits: typeof DEFAULT_RUNAWAY_LIMITS;
}

export async function governanceOverview(sb: SB, userId: string): Promise<GovernanceOverview> {
  const companyId = await resolveCompanyId(sb, userId);
  const [founder, killSwitch, usage] = await Promise.all([
    isPlatformFounder(sb, userId),
    readKillSwitchState(sb, companyId),
    readBudgetUsage(sb, { companyId, agentId: null, missionId: null }),
  ]);
  return {
    gateVersion: AUTONOMY_GATE_VERSION,
    isFounder: founder,
    companyId,
    killSwitch,
    usage,
    limits: DEFAULT_BUDGET_LIMITS,
    runawayLimits: DEFAULT_RUNAWAY_LIMITS,
  };
}

/** Dry-run of the gate — evaluates policy WITHOUT executing anything. */
export async function simulateGate(
  sb: SB,
  userId: string,
  input: { readonly task: string; readonly agent?: string | undefined; readonly missionId?: string | null },
) {
  const r = resolveTask(input.task, input.agent ? { agent: input.agent as never } : {});
  const companyId = await resolveCompanyId(sb, userId);
  const [member, admin, founder, killSwitch, usage, counters] = await Promise.all([
    companyId ? requireCompanyMember(sb, userId, companyId) : Promise.resolve(false),
    companyId ? requireCompanyAdmin(sb, userId, companyId) : Promise.resolve(false),
    isPlatformFounder(sb, userId),
    readKillSwitchState(sb, companyId),
    readBudgetUsage(sb, { companyId, agentId: r.agentId, missionId: input.missionId ?? null }),
    readRunawayCounters(sb, { companyId, agentId: r.agentId, missionId: input.missionId ?? null, correlationId: null }),
  ]);

  const gateInput: GateInput = {
    action: {
      task: r.task,
      skillId: r.skillId,
      toolId: r.toolId,
      permissions: r.permissions,
      risk: r.risk,
      toolAvailable: r.toolAvailability === "available",
      externalIntegration: null,
    },
    agentId: r.agentId,
    actor: { userId, isCompanyMember: member, isCompanyAdmin: admin, isFounder: founder },
    resource: { companyId, dataScope: companyId ? "company" : "own_user", missionId: input.missionId ?? null, correlationId: null },
    killSwitch,
    usage,
    counters,
    approved: false,
  };

  const decision = canExecute(gateInput);
  return {
    resolution: r,
    decision,
    approvalRequest: decision.requiresApproval ? buildApprovalRequest(gateInput, decision, [r.note]) : null,
  };
}

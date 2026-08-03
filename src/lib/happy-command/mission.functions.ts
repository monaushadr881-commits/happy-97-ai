/**
 * HAPPY Autonomous Mission System — canonical server-function entry.
 *
 * Extends `src/lib/happy-command/command.functions.ts` (Command Engine),
 * `src/lib/founder/pipeline.ts`, `src/lib/founder/audit.ts` and
 * `public.approvals` (R158). NO new table, NO new runtime, NO new
 * approval engine, NO new AI provider.
 *
 * Every mission flows:
 *   Founder → adoptToCanonicalPipeline() → Permission → Impact →
 *   Approval (when required) → Audit → Execution → Mission Control.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import {
  MISSION_AUDIT_CATEGORY,
  buildMission,
  isMissionPhase,
  nextPhase,
  type MissionBlueprint,
  type MissionPhase,
  type MissionRecord,
} from "./mission-core";
import { readMission, readMissions } from "./mission-resolve";
import { parseCommandText } from "./command-core";
import { resolveCompanyId } from "./command-resolve";

function goalInput(input: unknown): { goal: string } {
  return { goal: parseCommandText((input as { goal?: unknown } | null)?.goal) };
}

function idInput(input: unknown): { id: string } {
  const id = (input as { id?: unknown } | null)?.id;
  if (typeof id !== "string" || !id) throw new Error("mission_id_required");
  return { id };
}

/** GOAL → PLAN → TASKS → AGENTS. Pure preview, nothing persisted. */
export const planMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(goalInput)
  .handler(async ({ data }): Promise<MissionBlueprint> => buildMission(data.goal));

export const startMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { goal?: unknown; confirmed?: unknown };
    return { goal: parseCommandText(v.goal), confirmed: v.confirmed === true };
  })
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      mission_id: string;
      status: "running" | "awaiting_approval";
      approval_id: string | null;
      mission: MissionBlueprint;
    }> => {
      const { supabase, userId } = context;
      const m = buildMission(data.goal);
      const companyId = await resolveCompanyId(supabase, userId);

      if (companyId) {
        try {
          await adoptToCanonicalPipeline(supabase, {
            domain: "founder",
            module: "mission",
            capability: m.intent,
            user_id: userId,
            company_id: companyId,
            source: "happy.missions",
            summary: `${m.intentLabel}: ${m.goal.slice(0, 160)}`,
            metadata: { intent: m.intent, risk: m.risk, tasks: m.tasks.length },
          });
        } catch {
          /* observability must never block execution */
        }
      }

      let approvalId: string | null = null;
      const needsApproval = m.requiresApproval && !data.confirmed;
      if (needsApproval && companyId) {
        try {
          const { data: row } = await supabase
            .from("approvals")
            .insert({
              company_id: companyId,
              entity_type: "happy.mission",
              entity_id: crypto.randomUUID(),
              title: `${m.intentLabel}: ${m.goal.slice(0, 120)}`,
              reason: m.reason,
              metadata: {
                intent: m.intent,
                impact: m.impact,
                expected_result: m.expectedResult,
                target_route: m.targetRoute,
                agents: m.agents,
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

      const missionId = await writeCanonicalAudit(supabase, {
        category: MISSION_AUDIT_CATEGORY,
        action: "start",
        entity_type: `happy.mission.${m.intent}`,
        company_id: companyId ?? undefined,
        severity: m.risk === "high" ? "notice" : "info",
        metadata: {
          goal: m.goal,
          intent: m.intent,
          intent_label: m.intentLabel,
          risk: m.risk,
          impact: m.impact,
          expected_result: m.expectedResult,
          target_route: m.targetRoute,
          agents: m.agents,
          tasks: m.tasks,
          approval_id: approvalId,
          phase: "goal",
        },
      });

      return {
        mission_id: missionId,
        status: needsApproval ? "awaiting_approval" : "running",
        approval_id: approvalId,
        mission: m,
      };
    },
  );

/** Founder approval recorded against an existing mission. */
export const approveMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(async ({ data, context }): Promise<{ mission_id: string; phase: MissionPhase }> => {
    const existing = await readMission(context.supabase, data.id);
    if (!existing) throw new Error("mission_not_found");
    await writeCanonicalAudit(context.supabase, {
      category: MISSION_AUDIT_CATEGORY,
      action: "approve",
      entity_type: "happy.mission",
      entity_id: existing.id,
      severity: "notice",
      metadata: { mission_id: existing.id, phase: "plan", note: "Approved by Founder" },
    });
    return { mission_id: existing.id, phase: "plan" };
  });

/** EXECUTION — advance the mission one canonical phase. */
export const advanceMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { id?: unknown; phase?: unknown; note?: unknown };
    const { id } = idInput(v);
    return {
      id,
      phase: isMissionPhase(v.phase) ? v.phase : null,
      note: typeof v.note === "string" ? v.note.slice(0, 500) : null,
    };
  })
  .handler(
    async ({
      data,
      context,
    }): Promise<{ mission_id: string; phase: MissionPhase; done: boolean }> => {
      const existing = await readMission(context.supabase, data.id);
      if (!existing) throw new Error("mission_not_found");
      if (existing.status === "aborted") throw new Error("mission_aborted");
      if (existing.status === "awaiting_approval") throw new Error("mission_awaiting_approval");

      const target = data.phase ?? nextPhase(existing.phase);
      if (!target) return { mission_id: existing.id, phase: existing.phase, done: true };

      await writeCanonicalAudit(context.supabase, {
        category: MISSION_AUDIT_CATEGORY,
        action: "advance",
        entity_type: "happy.mission",
        entity_id: existing.id,
        severity: "info",
        metadata: { mission_id: existing.id, phase: target, note: data.note },
      });
      return { mission_id: existing.id, phase: target, done: target === "improvement" };
    },
  );

/** VERIFICATION — record the verification outcome, never assume success. */
export const verifyMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { id?: unknown; passed?: unknown; note?: unknown };
    const { id } = idInput(v);
    return {
      id,
      passed: v.passed === true,
      note: typeof v.note === "string" ? v.note.slice(0, 1000) : null,
    };
  })
  .handler(
    async ({ data, context }): Promise<{ mission_id: string; passed: boolean }> => {
      const existing = await readMission(context.supabase, data.id);
      if (!existing) throw new Error("mission_not_found");
      await writeCanonicalAudit(context.supabase, {
        category: MISSION_AUDIT_CATEGORY,
        action: data.passed ? "verify_passed" : "verify_failed",
        entity_type: "happy.mission",
        entity_id: existing.id,
        severity: data.passed ? "info" : "warning",
        metadata: {
          mission_id: existing.id,
          phase: "verification",
          note: data.note ?? (data.passed ? "Verification passed" : "Verification failed"),
        },
      });
      return { mission_id: existing.id, passed: data.passed };
    },
  );

/** REPORT — Founder-facing mission report assembled from canonical events. */
export const reportMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(
    async ({
      data,
      context,
    }): Promise<{ mission: MissionRecord; summary: string }> => {
      const mission = await readMission(context.supabase, data.id);
      if (!mission) throw new Error("mission_not_found");
      const failures = mission.events.filter((e) => e.action === "verify_failed").length;
      const summary = [
        `${mission.intentLabel} — ${mission.status.replace("_", " ")} at ${mission.progress}%.`,
        `Phase: ${mission.phase}.`,
        `Agents: ${mission.agents.join(", ") || "unassigned"}.`,
        failures ? `${failures} verification failure(s) require attention.` : "No verification failures.",
      ].join(" ");
      return { mission, summary };
    },
  );

export const listMissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = (input as { limit?: unknown } | null)?.limit;
    const n = typeof raw === "number" ? Math.floor(raw) : 20;
    return { limit: Math.min(50, Math.max(1, n)) };
  })
  .handler(async ({ data, context }): Promise<{ missions: MissionRecord[] }> => ({
    missions: await readMissions(context.supabase, data.limit),
  }));

export const getMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(async ({ data, context }): Promise<{ mission: MissionRecord | null }> => ({
    mission: await readMission(context.supabase, data.id),
  }));

export const abortMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = (input ?? {}) as { id?: unknown; reason?: unknown };
    const { id } = idInput(v);
    return { id, reason: typeof v.reason === "string" ? v.reason.slice(0, 500) : null };
  })
  .handler(async ({ data, context }): Promise<{ mission_id: string; status: "aborted" }> => {
    const existing = await readMission(context.supabase, data.id);
    if (!existing) throw new Error("mission_not_found");
    await writeCanonicalAudit(context.supabase, {
      category: MISSION_AUDIT_CATEGORY,
      action: "abort",
      entity_type: "happy.mission",
      entity_id: existing.id,
      severity: "notice",
      metadata: {
        mission_id: existing.id,
        phase: existing.phase,
        note: data.reason ?? "Aborted by Founder",
      },
    });
    return { mission_id: existing.id, status: "aborted" };
  });

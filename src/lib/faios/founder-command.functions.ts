/** R66 FAIOS — command ingestion, planning, approval, execution stubs. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFaiosAccess, writeFaiosAudit } from "./gate";
import { detectIntent } from "./intent-engine";
import { AUTO_MODE_FORBIDDEN } from "./contracts";

const ModeSchema = z.enum(["explain", "suggest", "preview", "approval", "automatic", "emergency", "read_only"]);

export const submitFounderCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    raw_text: z.string().min(1).max(4000),
    mode: ModeSchema.default("approval"),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "submitFounderCommand", source: "api", module: "faios.command.submitFounderCommand" });
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const detection = detectIntent(data.raw_text);

    const autoAllowed = data.mode === "automatic"
      && detection.autoModeAllowed
      && !AUTO_MODE_FORBIDDEN.includes(detection.category)
      && !detection.plan.blocked;

    const requiresApproval = detection.plan.requires_approval && !autoAllowed;
    const status = requiresApproval ? "awaiting_approval"
      : detection.plan.blocked ? "blocked"
      : autoAllowed ? "approved" : "planned";

    const { data: row, error } = await sb.from("faios_commands").insert({
      founder_id: context.userId,
      raw_text: data.raw_text,
      intent: detection.intent,
      category: detection.category,
      status,
      mode: data.mode,
      plan: detection.plan,
      risk_level: detection.plan.risk,
      impact: detection.plan.impact,
      requires_approval: requiresApproval,
    }).select().single();
    if (error) throw new Error(error.message);

    await sb.from("faios_activity").insert({
      founder_id: context.userId, command_id: row.id,
      stage: "planning", status: "succeeded",
      detail: { intent: detection.intent, category: detection.category, blocked: detection.plan.blocked ?? false },
    });
    await sb.from("faios_terminal_lines").insert({
      founder_id: context.userId, command_id: row.id, channel: "planner", level: "info",
      message: `HAPPY understood: ${detection.plan.summary}`,
    });
    await writeFaiosAudit(context, { action: "command_submitted", entity_type: "faios_commands", entity_id: row.id, metadata: { intent: detection.intent, mode: data.mode } });
    return { command: row, plan: detection.plan };
  });

export const approveFounderCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    command_id: z.string().uuid(),
    decision: z.enum(["approve", "reject"]),
    note: z.string().max(1000).optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "approveFounderCommand", source: "api", module: "faios.command.approveFounderCommand" });
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { data: cmd, error: e0 } = await sb.from("faios_commands").select("*").eq("id", data.command_id).maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!cmd) throw new Error("Command not found");
    if (cmd.status !== "awaiting_approval" && cmd.status !== "planned") {
      throw new Error(`Cannot decide command in status '${cmd.status}'`);
    }

    const newStatus = data.decision === "approve" ? "approved" : "rejected";
    const { error: e1 } = await sb.from("faios_commands").update({
      status: newStatus,
      approved_at: data.decision === "approve" ? new Date().toISOString() : null,
      approved_by: data.decision === "approve" ? context.userId : null,
    }).eq("id", data.command_id);
    if (e1) throw new Error(e1.message);

    await sb.from("faios_approvals").insert({
      command_id: data.command_id, founder_id: context.userId, decision: data.decision, note: data.note ?? null,
    });
    await sb.from("faios_activity").insert({
      founder_id: context.userId, command_id: data.command_id,
      stage: "approval", status: newStatus, detail: { note: data.note ?? null },
    });
    await writeFaiosAudit(context, { action: `command_${data.decision}`, entity_type: "faios_commands", entity_id: data.command_id });
    return { ok: true, status: newStatus };
  });

export const executeFounderCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ command_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "executeFounderCommand", source: "api", module: "faios.command.executeFounderCommand" });
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { data: cmd, error: e0 } = await sb.from("faios_commands").select("*").eq("id", data.command_id).maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!cmd) throw new Error("Command not found");
    if (cmd.status !== "approved") throw new Error(`Command must be approved (current: ${cmd.status})`);

    const plan = cmd.plan ?? {};
    const blocked = Boolean(plan.blocked);
    const result: any = blocked
      ? { status: "blocked", reason: plan.blocked_reason, external_dependencies: plan.external_dependencies ?? null }
      : { status: "succeeded", note: "Plan queued. Runtime application requires Lovable code-writing surface — this endpoint records intent + gates approval; the actual file edits are performed by the Lovable agent turn that follows Founder approval." };

    const nextStatus = blocked ? "blocked" : "succeeded";
    await sb.from("faios_commands").update({
      status: nextStatus, executed_at: new Date().toISOString(), result,
    }).eq("id", data.command_id);
    await sb.from("faios_activity").insert({
      founder_id: context.userId, command_id: data.command_id,
      stage: "execution", status: nextStatus, detail: result,
    });
    await sb.from("faios_terminal_lines").insert({
      founder_id: context.userId, command_id: data.command_id, channel: "executor",
      level: blocked ? "warn" : "info",
      message: blocked ? `Blocked: ${plan.blocked_reason}` : "Execution recorded.",
    });
    await writeFaiosAudit(context, { action: "command_executed", entity_type: "faios_commands", entity_id: data.command_id, metadata: { status: nextStatus } });
    return { status: nextStatus, result };
  });

export const listFounderCommands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { data: rows, error } = await sb.from("faios_commands")
      .select("*").eq("founder_id", context.userId)
      .order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return { commands: rows ?? [] };
  });

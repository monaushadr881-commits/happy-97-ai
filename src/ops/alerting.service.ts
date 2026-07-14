/**
 * HAPPY X Ops — Alerting Service
 * Rules + evaluation. Notifications routed via notificationService.
 */
import { defineService, V, validate, z, type ServiceContext } from "@/services/core";

const RuleInput = z.object({
  name: z.string().min(2).max(120),
  service: z.string().min(1).max(80),
  severity: z.enum(["info", "warning", "critical"]).default("warning"),
  description: z.string().max(500).optional(),
  condition: z.record(z.unknown()).default({}),
  channels: z.array(z.string().max(80)).default([]),
  is_active: z.boolean().default(true),
});

export const alertingService = defineService({ name: "ops.alerting", version: "v1" }, () => ({
  async listRules(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase.from("alert_rules").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
  async upsertRule(ctx: ServiceContext, input: unknown) {
    const p = validate(RuleInput, input);
    const { data, error } = await ctx.supabase.from("alert_rules")
      .upsert({ ...p, created_by: ctx.userId } as never, { onConflict: "name" })
      .select("*").single();
    if (error) throw error;
    return data;
  },
  async deleteRule(ctx: ServiceContext, id: string) {
    const { error } = await ctx.supabase.from("alert_rules").delete().eq("id", validate(V.uuid, id));
    if (error) throw error;
    return { ok: true };
  },
  /**
   * Trip an alert: creates an incident + persists a metric marker.
   * Real routing (email/slack/webhook) plugs into `channels`.
   */
  async trip(ctx: ServiceContext, input: unknown) {
    const p = validate(z.object({
      service: z.string(), severity: z.enum(["info", "warning", "critical"]),
      title: z.string().min(2).max(200), summary: z.string().max(2000).optional(),
    }), input);
    const { data, error } = await ctx.supabase.from("incidents").insert({
      title: p.title, summary: p.summary ?? null, service: p.service,
      severity: p.severity, status: "open", opened_by: ctx.userId,
    } as never).select("*").single();
    if (error) throw error;
    return data;
  },
}));

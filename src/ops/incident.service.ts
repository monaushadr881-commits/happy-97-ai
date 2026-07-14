/**
 * HAPPY X Ops — Incident Service
 * Timeline-driven incident tracking with structured transitions.
 */
import { defineService, V, validate, z, notFound, type ServiceContext } from "@/services/core";

const OpenInput = z.object({
  title: z.string().min(2).max(200),
  summary: z.string().max(2000).optional(),
  service: z.string().min(1).max(80),
  severity: z.enum(["info", "warning", "critical"]).default("warning"),
  metadata: z.record(z.unknown()).optional(),
});

const TransitionInput = z.object({
  id: V.uuid,
  status: z.enum(["open", "investigating", "identified", "monitoring", "resolved"]),
  message: z.string().min(1).max(2000),
});

const EventInput = z.object({
  id: V.uuid,
  kind: z.string().min(1).max(60),
  message: z.string().min(1).max(2000),
  metadata: z.record(z.unknown()).optional(),
});

export const incidentService = defineService({ name: "ops.incident", version: "v1" }, () => ({
  async list(ctx: ServiceContext, status?: string) {
    let q = ctx.supabase.from("incidents").select("*").order("opened_at", { ascending: false }).limit(200);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
  async byId(ctx: ServiceContext, id: string) {
    const { data, error } = await ctx.supabase.from("incidents").select("*").eq("id", validate(V.uuid, id)).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound("Incident not found");
    return data;
  },
  async timeline(ctx: ServiceContext, id: string) {
    const { data, error } = await ctx.supabase
      .from("incident_events").select("*").eq("incident_id", validate(V.uuid, id))
      .order("occurred_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  async open(ctx: ServiceContext, input: unknown) {
    const p = validate(OpenInput, input);
    const { data, error } = await ctx.supabase.from("incidents").insert({
      ...p, opened_by: ctx.userId, metadata: (p.metadata ?? {}) as never,
    } as never).select("*").single();
    if (error) throw error;
    await ctx.supabase.from("incident_events").insert({
      incident_id: (data as { id: string }).id, kind: "opened", message: "Incident opened", actor_id: ctx.userId,
    } as never);
    return data;
  },
  async addEvent(ctx: ServiceContext, input: unknown) {
    const p = validate(EventInput, input);
    const { data, error } = await ctx.supabase.from("incident_events").insert({
      incident_id: p.id, kind: p.kind, message: p.message, actor_id: ctx.userId,
      metadata: (p.metadata ?? {}) as never,
    } as never).select("*").single();
    if (error) throw error;
    return data;
  },
  async transition(ctx: ServiceContext, input: unknown) {
    const p = validate(TransitionInput, input);
    const patch: Record<string, unknown> = { status: p.status };
    if (p.status === "resolved") patch.resolved_at = new Date().toISOString();
    const { data, error } = await ctx.supabase.from("incidents").update(patch as never)
      .eq("id", p.id).select("*").single();
    if (error) throw error;
    await ctx.supabase.from("incident_events").insert({
      incident_id: p.id, kind: `status.${p.status}`, message: p.message, actor_id: ctx.userId,
    } as never);
    return data;
  },
}));

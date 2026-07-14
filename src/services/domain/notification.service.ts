/**
 * HAPPY X — Notification Service
 */
import { defineService, V, validate, z, type ServiceContext } from "../core";

const CreateInput = z.object({
  user_id: V.uuid,
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  category: z.string().max(60).default("system"),
  metadata: z.record(z.unknown()).optional(),
});

export const notificationService = defineService({ name: "notification", version: "v1" }, () => ({
  async listMine(ctx: ServiceContext, limit = 50) {
    const { data, error } = await ctx.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  async send(ctx: ServiceContext, input: unknown) {
    const data = validate(CreateInput, input);
    const { data: row, error } = await ctx.supabase
      .from("notifications").insert(data as never).select("*").single();
    if (error) throw error;
    return row;
  },
  async markRead(ctx: ServiceContext, id: string) {
    const { error } = await ctx.supabase
      .from("notifications").update({ read_at: new Date().toISOString() } as never)
      .eq("id", validate(V.uuid, id)).eq("user_id", ctx.userId);
    if (error) throw error;
    return { ok: true };
  },
}));

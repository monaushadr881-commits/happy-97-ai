/**
 * HAPPY X — Notification Service
 *
 * Real end-to-end operations on public.notifications + public.notification_preferences.
 * RLS on both tables scopes rows to auth.uid(); we still constrain by ctx.userId defensively.
 */
import { defineService, V, validate, z, type ServiceContext } from "../core";

const CHANNELS = ["in_app", "email", "sms", "push", "webhook"] as const;
export type Channel = (typeof CHANNELS)[number];

const CreateInput = z.object({
  user_id: V.uuid,
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  kind: z.string().max(60).default("system"),
  channel: z.enum(CHANNELS).default("in_app"),
  action_url: z.string().max(500).optional(),
  payload: z.record(z.unknown()).optional(),
});

const ListInput = z.object({
  filter: z.enum(["all", "unread", "read"]).default("all"),
  kind: z.string().max(60).optional(),
  limit: z.number().int().min(1).max(200).default(100),
}).default({ filter: "all", limit: 100 });

const PrefUpsertInput = z.object({
  kind: z.string().min(1).max(60),
  channel: z.enum(CHANNELS),
  enabled: z.boolean(),
});

export const notificationService = defineService({ name: "notification", version: "v1" }, () => ({
  async list(ctx: ServiceContext, input: unknown = {}) {
    const { filter, kind, limit } = validate(ListInput, input ?? {});
    let q = ctx.supabase
      .from("notifications")
      .select("id, user_id, kind, channel, title, body, action_url, payload, read_at, delivered_at, created_at")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filter === "unread") q = q.is("read_at", null);
    if (filter === "read") q = q.not("read_at", "is", null);
    if (kind) q = q.eq("kind", kind);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async unreadCount(ctx: ServiceContext) {
    const { count, error } = await ctx.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.userId)
      .is("read_at", null);
    if (error) throw error;
    return { count: count ?? 0 };
  },

  async categoryCounts(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase
      .from("notifications")
      .select("kind, read_at")
      .eq("user_id", ctx.userId)
      .limit(1000);
    if (error) throw error;
    const map: Record<string, { total: number; unread: number }> = {};
    for (const r of data ?? []) {
      const k = (r as { kind: string }).kind || "system";
      map[k] ??= { total: 0, unread: 0 };
      map[k].total++;
      if (!(r as { read_at: string | null }).read_at) map[k].unread++;
    }
    return map;
  },

  async markRead(ctx: ServiceContext, id: string) {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("id", validate(V.uuid, id))
      .eq("user_id", ctx.userId);
    if (error) throw error;
    return { ok: true };
  },

  async markUnread(ctx: ServiceContext, id: string) {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ read_at: null } as never)
      .eq("id", validate(V.uuid, id))
      .eq("user_id", ctx.userId);
    if (error) throw error;
    return { ok: true };
  },

  async markAllRead(ctx: ServiceContext) {
    const now = new Date().toISOString();
    const { error, count } = await ctx.supabase
      .from("notifications")
      .update({ read_at: now } as never, { count: "exact" })
      .eq("user_id", ctx.userId)
      .is("read_at", null);
    if (error) throw error;
    return { ok: true, updated: count ?? 0 };
  },

  async remove(ctx: ServiceContext, id: string) {
    const { error } = await ctx.supabase
      .from("notifications")
      .delete()
      .eq("id", validate(V.uuid, id))
      .eq("user_id", ctx.userId);
    if (error) throw error;
    return { ok: true };
  },

  async send(ctx: ServiceContext, input: unknown) {
    const data = validate(CreateInput, input);
    const { data: row, error } = await ctx.supabase
      .from("notifications").insert(data as never).select("*").single();
    if (error) throw error;
    return row;
  },

  async listPreferences(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase
      .from("notification_preferences")
      .select("id, kind, channel, enabled, updated_at")
      .eq("user_id", ctx.userId)
      .order("kind", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async upsertPreference(ctx: ServiceContext, input: unknown) {
    const parsed = validate(PrefUpsertInput, input);
    const { data, error } = await ctx.supabase
      .from("notification_preferences")
      .upsert(
        { user_id: ctx.userId, ...parsed } as never,
        { onConflict: "user_id,kind,channel" },
      )
      .select("id, kind, channel, enabled, updated_at")
      .single();
    if (error) throw error;
    return data;
  },
}));

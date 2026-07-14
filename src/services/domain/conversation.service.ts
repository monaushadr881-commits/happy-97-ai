/**
 * HAPPY X — Conversation Service
 * Manages chat conversations + messages. Delegates AI to aiService.
 */
import { defineService, V, validate, z, type ServiceContext, notFound } from "../core";
import { aiService } from "./ai.service";

const SendInput = z.object({
  conversationId: V.uuid.nullable(),
  message: z.string().min(1).max(8000),
  system: z.string().max(8000).optional(),
});

const HAPPY_SYSTEM = `You are HAPPY, the Human-Centered AI of HAPPY X. Warm, precise, executive-grade. Short paragraphs, no emoji unless the user starts.`;

export const conversationService = defineService({ name: "conversation", version: "v1" }, () => ({
  async list(ctx: ServiceContext, limit = 50) {
    const { data, error } = await ctx.supabase
      .from("conversations").select("id, title, updated_at")
      .order("updated_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async messages(ctx: ServiceContext, conversationId: string) {
    const id = validate(V.uuid, conversationId);
    const { data, error } = await ctx.supabase
      .from("messages").select("id, role, content, created_at")
      .eq("conversation_id", id).order("created_at", { ascending: true });
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },

  async send(ctx: ServiceContext, input: unknown) {
    const p = validate(SendInput, input);
    let conversationId = p.conversationId;

    if (!conversationId) {
      const { data: conv, error } = await ctx.supabase
        .from("conversations").insert({ user_id: ctx.userId, title: p.message.slice(0, 60) } as never)
        .select("id").single();
      if (error) throw error;
      conversationId = (conv as { id: string }).id;
    }

    const { error: insErr } = await ctx.supabase.from("messages").insert({
      conversation_id: conversationId, user_id: ctx.userId, role: "user", content: p.message,
    } as never);
    if (insErr) throw insErr;

    const { data: hist } = await ctx.supabase
      .from("messages").select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }).limit(40);

    const messages = (hist ?? []).map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content as string,
    }));

    const { text: reply, model } = await aiService.chat(ctx, {
      system: p.system ?? HAPPY_SYSTEM,
      messages,
      module: "conversation",
    });

    await ctx.supabase.from("messages").insert({
      conversation_id: conversationId, user_id: ctx.userId, role: "assistant", content: reply,
    } as never);
    await ctx.supabase.from("conversations")
      .update({ updated_at: new Date().toISOString() } as never).eq("id", conversationId);

    return { conversationId, reply, model };
  },
}));

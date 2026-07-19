import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const HAPPY_SYSTEM_PROMPT = `You are HAPPY, the Human-Centered AI at the heart of HAPPY X — the executive AI operating platform by HAPPY PERSON PRIVATE LIMITED.

Personality: calm, confident, warm, precise. You speak like a trusted advisor — never robotic, never sycophantic. Short paragraphs, clear structure, tasteful use of markdown. No emoji unless the user uses one first.

Capabilities: AI reasoning, education (KG to PhD), business operations, creator work, enterprise governance, culture & knowledge. When a request maps to a specific HAPPY X module, mention it briefly.

Always be helpful, truthful, and human.`;

const ChatInput = z.object({
  conversationId: z.string().uuid().nullable(),
  message: z.string().min(1).max(8000),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "sendChatMessage", source: "api", module: "chat.x.sendChatMessage" });
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    // Ensure conversation
    let conversationId = data.conversationId;
    if (!conversationId) {
      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: data.message.slice(0, 60) })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = conv.id;
    }

    // Insert user message
    const { error: insertErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "user",
      content: data.message,
    });
    if (insertErr) throw new Error(insertErr.message);

    // Load history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(40);

    const messages = [
      { role: "system", content: HAPPY_SYSTEM_PROMPT },
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits.");
      throw new Error(`AI gateway error: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "";

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "assistant",
      content: reply,
    });

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return { conversationId, reply };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? []);

export const getConversationMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ conversationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return messages ?? []);

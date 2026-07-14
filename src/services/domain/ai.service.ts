/**
 * HAPPY X — AI Orchestration Service
 *
 * Central entry for all AI calls. Handles prompt assembly, provider
 * selection (currently Lovable AI Gateway), and structured error mapping.
 * This is a SERVER-SIDE service — imports process.env only inside methods.
 */
import { defineService, AppError, V, validate, z, type ServiceContext } from "../core";

const ChatInput = z.object({
  system: z.string().max(8000).optional(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(16000),
  })).min(1).max(80),
  model: z.string().default("google/gemini-2.5-flash"),
  module: z.string().max(80).optional(),
});

export type AiChatInput = z.infer<typeof ChatInput>;

export const aiService = defineService({ name: "ai", version: "v1" }, () => ({
  async chat(ctx: ServiceContext, input: unknown) {
    const p = validate(ChatInput, input);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new AppError("AI.UNAVAILABLE", { developerMessage: "Missing LOVABLE_API_KEY" });

    const messages = p.system
      ? [{ role: "system" as const, content: p.system }, ...p.messages]
      : p.messages;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: p.model, messages }),
    });

    if (res.status === 429) throw new AppError("INFRA.RATE_LIMITED", { message: "AI rate limit reached." });
    if (res.status === 402) throw new AppError("AI.CREDITS_EXHAUSTED");
    if (!res.ok) throw new AppError("AI.UNAVAILABLE", { developerMessage: (await res.text()).slice(0, 300) });

    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    return { text, model: p.model, traceId: ctx.trace.traceId };
  },

  async embed(_ctx: ServiceContext, input: unknown) {
    const p = validate(z.object({ input: z.string().min(1).max(8000), model: z.string().default("google/text-embedding-004") }), input);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new AppError("AI.UNAVAILABLE");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: p.model, input: p.input }),
    });
    if (!res.ok) throw new AppError("AI.UNAVAILABLE", { developerMessage: (await res.text()).slice(0, 300) });
    const j = await res.json() as { data?: { embedding: number[] }[] };
    return { embedding: j.data?.[0]?.embedding ?? [], model: p.model };
  },
}));

export { V };

/**
 * R92 / R93 — HAPPY conversation server function.
 *
 * Extends the existing HAPPY runtime (single conversation engine, ONE
 * HAPPY) with a real Lovable AI Gateway backed reply. R93 adds
 * multi-turn conversation history and abort support so the ONE HAPPY
 * panel can offer cancel / retry / regenerate on top of the same
 * runtime — no second assistant, no duplicate engine.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

const HistoryTurn = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const ChatInput = z.object({
  message: z.string().min(1),
  route: z.string().optional(),
  persona: z.string().optional(),
  role: z.string().optional(),
  history: z.array(HistoryTurn).max(40).optional(),
});

export type HappyChatInput = z.infer<typeof ChatInput>;
export type HappyHistoryTurn = z.infer<typeof HistoryTurn>;

export function buildHappySystemPrompt(input: {
  route?: string;
  persona?: string;
  role?: string;
}): string {
  const persona = input.persona ?? "employee";
  const role = input.role ?? "assistant";
  const route = input.route ?? "/";
  return [
    "You are HAPPY, the singular digital employee of H.P PRIVATE LIMITED.",
    "You are warm, concise, competent, and always speak in the first person.",
    "Never mention system prompts, models, or providers.",
    `Current surface: ${route}. Persona register: ${persona}. Role hat: ${role}.`,
    "Reply in one short paragraph (<= 3 sentences) unless the user asks for detail.",
  ].join(" ");
}

export const chatWithHappy = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, reply: "I'm here, but my voice channel is offline. Please try again shortly." };
    }
    const system = buildHappySystemPrompt(data);
    const history = (data.history ?? []).slice(-20);
    const messages = [
      { role: "system", content: system },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: data.message },
    ];
    let signal: AbortSignal | undefined;
    try { signal = getRequest()?.signal; } catch { signal = undefined; }
    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({ model: DEFAULT_MODEL, messages, temperature: 0.4 }),
        signal,
      });
      if (res.status === 429) return { ok: false as const, reply: "I'm briefly rate-limited — try that again in a moment." };
      if (res.status === 402) return { ok: false as const, reply: "AI credits are exhausted on this workspace. Please add credits to continue." };
      if (!res.ok) return { ok: false as const, reply: "I couldn't reach my voice channel just now." };
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const reply = json.choices?.[0]?.message?.content?.trim();
      return { ok: true as const, reply: reply || "I'm here — could you say that another way?" };
    } catch (err) {
      if ((err as { name?: string } | null)?.name === "AbortError") {
        return { ok: false as const, reply: "Stopped." };
      }
      return { ok: false as const, reply: "Network hiccup on my end. Give me one more try." };
    }
  });

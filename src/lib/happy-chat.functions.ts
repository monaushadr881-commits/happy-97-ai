/**
 * R92 — HAPPY conversation server function.
 *
 * Extends the existing HAPPY runtime (single conversation engine, ONE
 * HAPPY) with a real Lovable AI Gateway backed reply. Reuses the same
 * `LOVABLE_API_KEY` + gateway URL pattern already used by other
 * server-side callers in this repo (no new SDK, no duplicate engine).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

const ChatInput = z.object({
  message: z.string().min(1),
  route: z.string().optional(),
  persona: z.string().optional(),
  role: z.string().optional(),
});

export type HappyChatInput = z.infer<typeof ChatInput>;

/**
 * Compose the HAPPY system prompt from workspace context. Kept short so
 * it fits every model window and mirrors the persona/role hats the
 * runtime already surfaces on the posture chip.
 */
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
    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: data.message },
          ],
          temperature: 0.4,
        }),
      });
      if (res.status === 429) return { ok: false as const, reply: "I'm briefly rate-limited — try that again in a moment." };
      if (res.status === 402) return { ok: false as const, reply: "AI credits are exhausted on this workspace. Please add credits to continue." };
      if (!res.ok) return { ok: false as const, reply: "I couldn't reach my voice channel just now." };
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const reply = json.choices?.[0]?.message?.content?.trim();
      return { ok: true as const, reply: reply || "I'm here — could you say that another way?" };
    } catch {
      return { ok: false as const, reply: "Network hiccup on my end. Give me one more try." };
    }
  });

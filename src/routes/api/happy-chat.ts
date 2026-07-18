/**
 * R94 — HAPPY streaming chat proxy.
 *
 * Forwards SSE from the Lovable AI Gateway chat/completions endpoint so
 * the ONE HAPPY panel can render token-by-token. Reuses the same
 * runtime, prompt, persona and history contract as `chatWithHappy`.
 * No second AI runtime.
 */
import { createFileRoute } from "@tanstack/react-router";
import { buildHappySystemPrompt } from "@/lib/happy-chat.functions";
import { requireSupabaseUser, enforceRateLimit } from "@/lib/security/api-auth";

type Turn = { role: "user" | "assistant"; content: string };
type Body = {
  message?: unknown;
  route?: unknown;
  persona?: unknown;
  role?: unknown;
  history?: unknown;
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

function sanitizeHistory(h: unknown): Turn[] {
  if (!Array.isArray(h)) return [];
  return h
    .filter((x): x is Turn =>
      !!x && typeof x === "object" &&
      (x as Turn).role !== undefined &&
      ((x as Turn).role === "user" || (x as Turn).role === "assistant") &&
      typeof (x as Turn).content === "string" && (x as Turn).content.length > 0,
    )
    .slice(-20)
    .map((x) => ({ role: x.role, content: x.content.slice(0, 4000) }));
}

export const Route = createFileRoute("/api/happy-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireSupabaseUser(request);
        if (auth instanceof Response) return auth;
        const rl = enforceRateLimit(`happy_chat:${auth.userId}`, { capacity: 8, refillPerSec: 30 / 60 });
        if (rl) return rl;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json().catch(() => ({}))) as Body;
        const message = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";
        if (!message) return new Response("message is required", { status: 400 });

        const system = buildHappySystemPrompt({
          route: typeof body.route === "string" ? body.route : undefined,
          persona: typeof body.persona === "string" ? body.persona : undefined,
          role: typeof body.role === "string" ? body.role : undefined,
        });
        const history = sanitizeHistory(body.history);
        const messages = [
          { role: "system", content: system },
          ...history,
          { role: "user", content: message },
        ];

        try {
          const upstream = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ model: MODEL, messages, temperature: 0.4, stream: true }),
            signal: request.signal,
          });
          if (upstream.status === 429) return new Response("rate_limited", { status: 429 });
          if (upstream.status === 402) return new Response("credits_exhausted", { status: 402 });
          if (!upstream.ok || !upstream.body) {
            const err = await upstream.text().catch(() => "");
            return new Response(err || `upstream ${upstream.status}`, { status: upstream.status });
          }
          return new Response(upstream.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
              "X-Accel-Buffering": "no",
            },
          });
        } catch (err) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          const msg = err instanceof Error ? err.message : "stream failed";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});

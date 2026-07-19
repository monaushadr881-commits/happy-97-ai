/**
 * HAPPY Digital Human — Text-to-Speech proxy.
 *
 * Streams SSE audio from the Lovable AI Gateway. Server-only API key.
 *
 * R106 hardening:
 *  - Requires a valid Supabase bearer token (mirrors requireSupabaseAuth).
 *  - Per-user token-bucket rate limit (in-memory).
 *  - Strict input validation on text length, voice allowlist, speed range.
 *  - Never returns the upstream error body to the client.
 */
import { createFileRoute } from "@tanstack/react-router";
import { checkRateLimit } from "@/services/core/rate-limit";
import { AppError } from "@/services/core/errors";

type Body = { text?: unknown; voice?: unknown; speed?: unknown; language?: unknown };

const VOICE_ALLOWLIST = new Set([
  "alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse",
]);

function decodeJwtSub(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { sub?: string; exp?: number };
    if (!payload.sub) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

async function authenticate(request: Request): Promise<{ userId: string } | Response> {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  const token = authHeader.slice(7).trim();
  const sub = decodeJwtSub(token);
  if (!sub) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  // Verify the token against Supabase Auth so a forged JWT is rejected.
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
  const check = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  });
  if (!check.ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  return { userId: sub };
}

export const Route = createFileRoute("/api/dh/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const { userId } = auth;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          console.error("[dh/tts] LOVABLE_API_KEY missing");
          return new Response(JSON.stringify({ error: "server_misconfigured" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        // Rate limit: 20 requests/min sustained, burst 8. Keyed per user.
        try {
          checkRateLimit(`dh_tts:${userId}`, { capacity: 8, refillPerSec: 20 / 60 });
        } catch (e) {
          if (e instanceof AppError && e.code === "INFRA.RATE_LIMITED") {
            return new Response(JSON.stringify({ error: "rate_limited" }), {
              status: 429, headers: { "Content-Type": "application/json", "Retry-After": "5" },
            });
          }
          throw e;
        }

        const body = (await request.json().catch(() => ({}))) as Body;
        const rawText = typeof body.text === "string" ? body.text : "";
        const text = rawText.slice(0, 3000).trim();
        if (!text) {
          return new Response(JSON.stringify({ error: "text_required" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        const voiceIn = typeof body.voice === "string" ? body.voice : "alloy";
        const voice = VOICE_ALLOWLIST.has(voiceIn) ? voiceIn : "alloy";
        const speed = typeof body.speed === "number" && Number.isFinite(body.speed)
          ? Math.max(0.5, Math.min(2, body.speed))
          : 1.0;

        // R183 Phase B — Universal HAPPY Brain™ gate for voice output.
        // Runs canonical `runBrain()`/lite classify on the text before TTS and
        // records one canonical audit line for the AI entry.
        try {
          const { withBrain } = await import("@/lib/founder/enforce");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await withBrain(
            { userId, supabase: supabaseAdmin as never, companyId: null },
            { input: text, source: "voice", module: "dh-tts", channel: "voice" },
          );
        } catch { /* audit/brain is best-effort — never block TTS */ }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice,
            speed,
            stream_format: "sse",
            response_format: "pcm",
          }),
        });
        if (!upstream.ok) {
          // Log server-side, expose only a generic message to the client.
          const detail = await upstream.text().catch(() => "");
          console.warn(`[dh/tts] upstream ${upstream.status}`, detail.slice(0, 300));
          if (upstream.status === 429) {
            return new Response(JSON.stringify({ error: "ai_rate_limited" }), {
              status: 429, headers: { "Content-Type": "application/json" },
            });
          }
          if (upstream.status === 402) {
            return new Response(JSON.stringify({ error: "ai_credits_exhausted" }), {
              status: 402, headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify({ error: "tts_failed" }), {
            status: 502, headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});

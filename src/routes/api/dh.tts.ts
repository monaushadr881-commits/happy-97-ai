/**
 * HAPPY Digital Human — Text-to-Speech proxy.
 * Streams SSE audio from the Lovable AI Gateway. Server-only key.
 */
import { createFileRoute } from "@tanstack/react-router";

type Body = { text?: unknown; voice?: unknown; speed?: unknown; language?: unknown };

export const Route = createFileRoute("/api/dh/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json().catch(() => ({}))) as Body;
        const text = typeof body.text === "string" ? body.text.slice(0, 3000) : "";
        const voice = typeof body.voice === "string" ? body.voice : "alloy";
        const speed = typeof body.speed === "number" ? Math.max(0.5, Math.min(2, body.speed)) : 1.0;
        if (!text.trim()) return new Response("text is required", { status: 400 });

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
          const err = await upstream.text().catch(() => "");
          return new Response(err || `TTS failed: ${upstream.status}`, { status: upstream.status });
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

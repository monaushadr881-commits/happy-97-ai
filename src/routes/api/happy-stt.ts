/**
 * R95 — HAPPY speech-to-text bridge.
 *
 * Optional server-side STT fallback that reuses the existing Lovable AI
 * Gateway runtime (no second voice runtime). The browser voice listener
 * remains primary; this endpoint accepts an audio upload and returns the
 * transcript, so devices without Web Speech API can still feed the voice
 * bridge in HappyDesk.
 */
import { createFileRoute } from "@tanstack/react-router";
import { requireSupabaseUser, enforceRateLimit } from "@/lib/security/api-auth";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/audio/transcriptions";
const MODEL = "openai/gpt-4o-mini-transcribe";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB safety cap

export const Route = createFileRoute("/api/happy-stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return new Response("expected multipart/form-data", { status: 400 });
        }

        const file = form.get("file");
        if (!(file instanceof Blob)) return new Response("file is required", { status: 400 });
        if (file.size === 0) return new Response("empty audio", { status: 400 });
        if (file.size > MAX_BYTES) return new Response("audio too large", { status: 413 });

        const upstream = new FormData();
        upstream.append("file", file, (file as File).name || "audio.webm");
        upstream.append("model", MODEL);

        try {
          const res = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${key}` },
            body: upstream,
            signal: request.signal,
          });
          if (res.status === 429) return new Response("rate_limited", { status: 429 });
          if (res.status === 402) return new Response("credits_exhausted", { status: 402 });
          if (!res.ok) {
            const err = await res.text().catch(() => "");
            return new Response(err || `upstream ${res.status}`, { status: res.status });
          }
          const payload = (await res.json().catch(() => ({}))) as { text?: unknown };
          const text = typeof payload.text === "string" ? payload.text.trim() : "";
          return Response.json({ text });
        } catch (err) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          const msg = err instanceof Error ? err.message : "stt failed";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});

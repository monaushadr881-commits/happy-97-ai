/**
 * R94 — HAPPY streaming client helper.
 *
 * Fetches the ONE HAPPY /api/happy-chat SSE stream and yields text
 * deltas as they arrive. Reuses the same conversation contract as the
 * server function `chatWithHappy` (same prompt, same history shape).
 */

export type HappyStreamInput = {
  message: string;
  route?: string;
  persona?: string;
  role?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  signal?: AbortSignal;
  onDelta: (delta: string, accumulated: string) => void;
};

export type HappyStreamResult = {
  ok: boolean;
  text: string;
  errorKind?: "rate_limited" | "credits_exhausted" | "network" | "aborted" | "http";
};

/** Parse an OpenAI-compatible chat/completions SSE event and extract the delta text. */
function extractDelta(dataLine: string): string {
  if (!dataLine || dataLine === "[DONE]") return "";
  try {
    const j = JSON.parse(dataLine) as {
      choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
    };
    const c = j.choices?.[0];
    return c?.delta?.content ?? c?.message?.content ?? "";
  } catch {
    return "";
  }
}

export async function streamHappy(input: HappyStreamInput): Promise<HappyStreamResult> {
  const { message, route, persona, role, history, signal, onDelta } = input;
  let acc = "";
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return { ok: false, text: "Please sign in to chat with HAPPY.", errorKind: "http" };
    }
    const res = await fetch("/api/happy-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message, route, persona, role, history }),
      signal,
    });
    if (res.status === 429) return { ok: false, text: "I'm briefly rate-limited — try again in a moment.", errorKind: "rate_limited" };
    if (res.status === 402) return { ok: false, text: "AI credits are exhausted on this workspace. Please add credits to continue.", errorKind: "credits_exhausted" };
    if (!res.ok || !res.body) return { ok: false, text: "I couldn't reach my voice channel just now.", errorKind: "http" };

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      // SSE frames separated by blank line
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        // one frame may contain multiple `data:` lines; concatenate
        const dataLines = frame
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim());
        for (const dl of dataLines) {
          if (dl === "[DONE]") continue;
          const delta = extractDelta(dl);
          if (delta) {
            acc += delta;
            onDelta(delta, acc);
          }
        }
      }
    }
    return { ok: true, text: acc || "I'm here — could you say that another way?" };
  } catch (err) {
    if ((err as { name?: string } | null)?.name === "AbortError") {
      return { ok: false, text: acc || "Stopped.", errorKind: "aborted" };
    }
    return { ok: false, text: "Network hiccup on my end. Give me one more try.", errorKind: "network" };
  }
}

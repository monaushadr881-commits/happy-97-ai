import { describe, it, expect, vi, beforeEach } from "vitest";
import { streamHappy } from "@/lib/happy-stream";

function makeSse(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      c.close();
    },
  });
}

describe("R94 — HAPPY streaming client", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("accumulates SSE delta chunks token-by-token", async () => {
    const body = makeSse([
      `data: ${JSON.stringify({ choices: [{ delta: { content: "Hel" } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: "lo " } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: "HAPPY" } }] })}\n\n`,
      `data: [DONE]\n\n`,
    ]);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: 200 })));
    const deltas: string[] = [];
    const out = await streamHappy({
      message: "hi", onDelta: (d) => deltas.push(d),
    });
    expect(out.ok).toBe(true);
    expect(out.text).toBe("Hello HAPPY");
    expect(deltas).toEqual(["Hel", "lo ", "HAPPY"]);
  });

  it("maps 429/402 to typed error kinds", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 429 })));
    const r = await streamHappy({ message: "x", onDelta: () => {} });
    expect(r.ok).toBe(false);
    expect(r.errorKind).toBe("rate_limited");

    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 402 })));
    const r2 = await streamHappy({ message: "x", onDelta: () => {} });
    expect(r2.errorKind).toBe("credits_exhausted");
  });

  it("returns aborted with partial text when the signal fires", async () => {
    // Fetch that rejects like a real aborted fetch.
    vi.stubGlobal("fetch", vi.fn(async (_u, init?: RequestInit) => {
      await new Promise((_, rej) => {
        const s = init?.signal;
        s?.addEventListener("abort", () => {
          const e = new Error("aborted");
          e.name = "AbortError";
          rej(e);
        });
      });
      return new Response();
    }));
    const c = new AbortController();
    const p = streamHappy({ message: "x", onDelta: () => {}, signal: c.signal });
    c.abort();
    const r = await p;
    expect(r.ok).toBe(false);
    expect(r.errorKind).toBe("aborted");
  });
});

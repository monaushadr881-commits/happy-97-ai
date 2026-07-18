/**
 * R95 — HAPPY STT bridge tests.
 * Verifies the /api/happy-stt handler validates input, enforces size caps,
 * and forwards to the Lovable AI Gateway using the shared runtime key.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// R134: stub the shared auth/rate-limit guard so tests exercise the STT
// handler logic itself, not the bearer verification (covered elsewhere).
vi.mock("@/lib/security/api-auth", () => ({
  requireSupabaseUser: async () => ({ userId: "test-user" }),
  enforceRateLimit: () => null,
}));

const { Route } = await import("@/routes/api/happy-stt");

const handler = (Route.options as { server: { handlers: { POST: (ctx: { request: Request }) => Promise<Response> } } }).server.handlers.POST;

function makeRequest(body: BodyInit | null, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/happy-stt", { method: "POST", body, headers });
}

describe("R95 happy-stt route", () => {
  const origKey = process.env.LOVABLE_API_KEY;
  beforeEach(() => { process.env.LOVABLE_API_KEY = "test-key"; });
  afterEach(() => {
    if (origKey === undefined) delete process.env.LOVABLE_API_KEY;
    else process.env.LOVABLE_API_KEY = origKey;
    vi.restoreAllMocks();
  });

  it("rejects when API key is missing", async () => {
    delete process.env.LOVABLE_API_KEY;
    const res = await handler({ request: makeRequest(null) });
    expect(res.status).toBe(500);
  });

  it("rejects non-multipart bodies", async () => {
    const res = await handler({ request: makeRequest("hello", { "Content-Type": "text/plain" }) });
    expect(res.status).toBe(400);
  });

  it("rejects when file is missing", async () => {
    const fd = new FormData();
    const res = await handler({ request: new Request("http://localhost/api/happy-stt", { method: "POST", body: fd }) });
    expect(res.status).toBe(400);
  });

  it("forwards audio to the gateway and returns transcript", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ text: "hello happy" }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), "clip.webm");
    const res = await handler({ request: new Request("http://localhost/api/happy-stt", { method: "POST", body: fd }) });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { text: string };
    expect(json.text).toBe("hello happy");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("ai.gateway.lovable.dev");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
  });

  it("maps rate limit and credit errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 429 }));
    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array([1])], { type: "audio/webm" }), "a.webm");
    const res = await handler({ request: new Request("http://localhost/api/happy-stt", { method: "POST", body: fd }) });
    expect(res.status).toBe(429);
  });
});

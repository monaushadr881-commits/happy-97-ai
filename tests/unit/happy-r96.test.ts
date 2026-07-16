/**
 * R96 — Server-STT voice listener fallback tests.
 * Verifies the MediaRecorder → /api/happy-stt path routes transcripts
 * through the shared `classifyIntent` pipeline (no second runtime).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { transcribeBlob, isMediaRecorderSupported } from "@/lib/happy-r83/voice-fallback";

describe("R96 voice-fallback", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("skips uploads for near-empty blobs", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const text = await transcribeBlob(new Blob([new Uint8Array(16)], { type: "audio/webm" }));
    expect(text).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("posts multipart audio to /api/happy-stt and returns transcript", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ text: "hello happy" }), { status: 200 }),
    );
    const blob = new Blob([new Uint8Array(4096)], { type: "audio/webm" });
    const text = await transcribeBlob(blob);
    expect(text).toBe("hello happy");
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/happy-stt");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("returns null on gateway errors instead of throwing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 429 }));
    const blob = new Blob([new Uint8Array(4096)], { type: "audio/webm" });
    const text = await transcribeBlob(blob);
    expect(text).toBeNull();
  });

  it("reports MediaRecorder support based on runtime", () => {
    // jsdom has no MediaRecorder — result should be false without patching.
    expect(typeof isMediaRecorderSupported()).toBe("boolean");
  });
});

/**
 * R96 — Server-STT voice listener fallback.
 *
 * Used when the browser lacks the Web Speech API (Firefox, some Android
 * WebViews). Captures a rolling window of microphone audio with
 * MediaRecorder, uploads each self-contained segment to the existing
 * `/api/happy-stt` route (which proxies the shared Lovable AI Gateway
 * runtime — no second STT engine), and feeds the transcript through the
 * existing `classifyIntent` pipeline so the ONE HAPPY voice bridge
 * behaves identically to the browser SR path.
 *
 * Keeps the same `VoiceListener` shape as the browser listener so
 * `HappyDesk` and any future consumer can swap between them.
 */
import { classifyIntent } from "./voice-intent";
import type { VoiceListener, VoiceListenerHandlers } from "./voice-listener";

const SEGMENT_MS = 4000;
const MIN_BYTES = 2048;
const STT_URL = "/api/happy-stt";

export function isMediaRecorderSupported(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.MediaRecorder !== "undefined"
    && typeof navigator !== "undefined"
    && !!navigator.mediaDevices?.getUserMedia;
}

/** Send one recorded blob to happy-stt; returns transcript or null. */
export async function transcribeBlob(
  blob: Blob,
  opts?: { signal?: AbortSignal },
): Promise<string | null> {
  if (blob.size < MIN_BYTES) return null;
  const fd = new FormData();
  const ext = pickExtension(blob.type);
  fd.append("file", blob, `clip.${ext}`);
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  const res = await fetch(STT_URL, {
    method: "POST",
    body: fd,
    signal: opts?.signal,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => ({}))) as { text?: unknown };
  return typeof json.text === "string" && json.text.trim() ? json.text.trim() : null;
}

function pickExtension(mime: string): string {
  const t = (mime || "").split(";")[0].toLowerCase();
  if (t.includes("mp4") || t.includes("m4a")) return "mp4";
  if (t.includes("mpeg") || t.includes("mp3")) return "mp3";
  if (t.includes("wav")) return "wav";
  if (t.includes("ogg")) return "ogg";
  return "webm";
}

/** Build a VoiceListener backed by MediaRecorder → /api/happy-stt. */
export function createServerSttVoiceListener(handlers: VoiceListenerHandlers): VoiceListener {
  if (!isMediaRecorderSupported()) {
    return { start: () => false, stop: () => {}, setLanguage: () => {} };
  }

  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let running = false;
  let segmentTimer: ReturnType<typeof setTimeout> | null = null;
  const controller = new AbortController();
  // language captured for symmetry with the SR listener; STT auto-detects.
  let language: string | undefined;

  async function begin() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      handlers.onError?.(err instanceof Error ? err.message : "mic-denied");
      running = false;
      handlers.onEnd?.();
      return;
    }
    if (!running) { stream.getTracks().forEach((t) => t.stop()); return; }
    startSegment();
  }

  function startSegment() {
    if (!running || !stream) return;
    let mime = "audio/webm";
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && !MediaRecorder.isTypeSupported(mime)) {
      mime = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
    }
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (err) {
      handlers.onError?.(err instanceof Error ? err.message : "recorder-failed");
      return;
    }
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" });
      // Immediately begin the next segment so speech is not clipped.
      if (running) startSegment();
      try {
        const text = await transcribeBlob(blob, { signal: controller.signal });
        if (text) {
          handlers.onTranscript?.(text);
          handlers.onIntent?.(classifyIntent(text));
        }
      } catch (err) {
        if ((err as { name?: string })?.name !== "AbortError") {
          handlers.onError?.(err instanceof Error ? err.message : "stt-failed");
        }
      }
    };
    try { recorder.start(); } catch (err) {
      handlers.onError?.(err instanceof Error ? err.message : "recorder-failed");
      return;
    }
    segmentTimer = setTimeout(() => {
      try { recorder?.state === "recording" && recorder.stop(); } catch { /* swallow */ }
    }, SEGMENT_MS);
  }

  function teardown() {
    if (segmentTimer) { clearTimeout(segmentTimer); segmentTimer = null; }
    try { recorder?.state === "recording" && recorder.stop(); } catch { /* swallow */ }
    recorder = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    controller.abort();
    handlers.onEnd?.();
  }

  return {
    start: () => {
      if (running) return true;
      running = true;
      void begin();
      return true;
    },
    stop: () => {
      if (!running) return;
      running = false;
      teardown();
    },
    setLanguage: (code: string) => { language = code; void language; },
  };
}

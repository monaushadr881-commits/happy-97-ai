/**
 * useHappySpeech — client-side SSE PCM playback for HAPPY's voice.
 * Talks to /api/dh/tts (server proxy to Lovable AI Gateway). Muted or
 * blocked audio contexts short-circuit — HAPPY still shows subtitles.
 */
import { useCallback, useRef } from "react";

type Options = { voice?: string; speed?: number; onStart?: () => void; onEnd?: () => void; };

// Minimal SSE parser (no dependency)
function parseSse(chunk: string, onEvent: (data: string) => void, carry: { buf: string }) {
  carry.buf += chunk;
  let idx;
  while ((idx = carry.buf.indexOf("\n\n")) !== -1) {
    const raw = carry.buf.slice(0, idx);
    carry.buf = carry.buf.slice(idx + 2);
    for (const line of raw.split("\n")) {
      if (line.startsWith("data:")) onEvent(line.slice(5).trim());
    }
  }
}

export function useHappySpeech() {
  const ctxRef = useRef<AudioContext | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const speakingRef = useRef(false);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    speakingRef.current = false;
  }, []);

  const speak = useCallback(async (text: string, opts: Options = {}) => {
    if (!text.trim()) return;
    stop();
    const ac = new AbortController();
    abortRef.current = ac;

    let ctx = ctxRef.current;
    if (!ctx) { ctx = new AudioContext({ sampleRate: 24000 }); ctxRef.current = ctx; }
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});

    let playhead = 0;
    let pending = new Uint8Array(0);
    const playChunk = (incoming: Uint8Array) => {
      const bytes = new Uint8Array(pending.length + incoming.length);
      bytes.set(pending); bytes.set(incoming, pending.length);
      const usable = bytes.length - (bytes.length % 2);
      pending = bytes.slice(usable);
      if (!usable) return;
      const samples = new Int16Array(bytes.buffer, 0, usable / 2);
      const floats = Float32Array.from(samples, (s) => s / 32768);
      const buf = ctx!.createBuffer(1, floats.length, 24000);
      buf.copyToChannel(floats, 0);
      const src = ctx!.createBufferSource();
      src.buffer = buf; src.connect(ctx!.destination);
      if (playhead === 0) playhead = ctx!.currentTime + 0.05;
      else playhead = Math.max(playhead, ctx!.currentTime);
      src.start(playhead);
      playhead += buf.duration;
    };

    try {
      opts.onStart?.();
      speakingRef.current = true;
      const res = await fetch("/api/dh/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: opts.voice ?? "alloy", speed: opts.speed ?? 1 }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error(`TTS failed: ${res.status}`);
      const carry = { buf: "" };
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        parseSse(value, (data) => {
          let evt: { type?: string; audio?: string };
          try { evt = JSON.parse(data); } catch { return; }
          if (evt.type !== "speech.audio.delta" || !evt.audio) return;
          const bin = atob(evt.audio);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          playChunk(bytes);
        }, carry);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.warn("HAPPY speech failed:", e);
    } finally {
      speakingRef.current = false;
      opts.onEnd?.();
    }
  }, [stop]);

  return { speak, stop };
}

/**
 * useHappySpeech — client-side SSE PCM playback for HAPPY's voice.
 * Talks to /api/dh/tts (server proxy to Lovable AI Gateway). Muted or
 * blocked audio contexts short-circuit — HAPPY still shows subtitles.
 *
 * Real audio-reactive signal:
 *   - Each played PCM chunk is routed through a shared GainNode →
 *     AnalyserNode → destination.
 *   - A 60 Hz RAF loop reads the analyser's time-domain data and computes
 *     RMS (0..1). The value is exposed via getAmplitude() and pushed to
 *     any subscribers registered with subscribeAmplitude().
 *   - This is the real signal driving the avatar mouth overlay and the
 *     live waveform. Not fake timers.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { clearSpeech, publishSpeech, useSpeechSignal } from "./audio-bus";
import {
  INITIAL_VOICE_FALLBACK,
  voiceFallbackOnError,
  voiceFallbackOnRecovery,
  type VoiceFallbackState,
} from "./conversation-engine";

type Options = {
  voice?: string;
  speed?: number;
  onStart?: () => void;
  onEnd?: () => void;
  /** R110 P1 — TTS unavailable: caller should show subtitles / retry banner. */
  onFallback?: (state: VoiceFallbackState) => void;
  /** R110 P1 — TTS recovered: caller may hide subtitles banner. */
  onRecovery?: () => void;
};


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

/** Subscribe to HAPPY's live speech amplitude (0..1). Legacy shim. */
export function useSpeechAmplitude(): number {
  return useSpeechSignal().rms;
}

export function useHappySpeech() {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);
  const speakingRef = useRef(false);
  // R110 P1 — Track TTS availability; caller flips subtitles/retry banner UI.
  const fallbackRef = useRef<VoiceFallbackState>(INITIAL_VOICE_FALLBACK);
  const [fallback, setFallback] = useState<VoiceFallbackState>(INITIAL_VOICE_FALLBACK);


  const stopMeter = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    clearSpeech();
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    speakingRef.current = false;
    stopMeter();
  }, [stopMeter]);

  useEffect(() => () => stop(), [stop]);

  const speak = useCallback(
    async (text: string, opts: Options = {}) => {
      if (!text.trim()) return;
      stop();
      const ac = new AbortController();
      abortRef.current = ac;

      let ctx = ctxRef.current;
      if (!ctx) {
        ctx = new AudioContext({ sampleRate: 24000 });
        ctxRef.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = 1;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.55;
        gain.connect(analyser);
        analyser.connect(ctx.destination);
        gainRef.current = gain;
        analyserRef.current = analyser;
      }
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});

      const analyser = analyserRef.current!;
      const timeBuf = new Uint8Array(analyser.fftSize);
      const freqBuf = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(timeBuf);
        let sum = 0;
        for (let i = 0; i < timeBuf.length; i++) {
          const s = (timeBuf[i] - 128) / 128;
          sum += s * s;
        }
        const rms = Math.sqrt(sum / timeBuf.length);
        const shaped = Math.min(1, Math.pow(rms * 2.4, 0.85));

        // Spectral centroid → normalised 0..1. Rough proxy for vowel
        // brightness: closed/O sit low, E/AI sit high.
        analyser.getByteFrequencyData(freqBuf);
        let num = 0, den = 0;
        for (let i = 0; i < freqBuf.length; i++) {
          const w = freqBuf[i];
          num += i * w;
          den += w;
        }
        const centroid = den > 0 ? Math.min(1, (num / den) / freqBuf.length) : 0;

        publishSpeech(shaped, centroid);
        if (speakingRef.current) rafRef.current = requestAnimationFrame(tick);
        else stopMeter();
      };

      let playhead = 0;
      let pending = new Uint8Array(0);
      const playChunk = (incoming: Uint8Array) => {
        const bytes = new Uint8Array(pending.length + incoming.length);
        bytes.set(pending);
        bytes.set(incoming, pending.length);
        const usable = bytes.length - (bytes.length % 2);
        pending = bytes.slice(usable);
        if (!usable) return;
        const samples = new Int16Array(bytes.buffer, 0, usable / 2);
        const floats = Float32Array.from(samples, (s) => s / 32768);
        const buf = ctx!.createBuffer(1, floats.length, 24000);
        buf.copyToChannel(floats, 0);
        const src = ctx!.createBufferSource();
        src.buffer = buf;
        src.connect(gainRef.current!);
        if (playhead === 0) playhead = ctx!.currentTime + 0.05;
        else playhead = Math.max(playhead, ctx!.currentTime);
        src.start(playhead);
        playhead += buf.duration;
      };

      try {
        opts.onStart?.();
        speakingRef.current = true;
        rafRef.current = requestAnimationFrame(tick);
        const res = await fetch("/api/dh/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: opts.voice ?? "alloy", speed: opts.speed ?? 1 }),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) throw new Error(`TTS failed: ${res.status}`);
        // Success — clear any prior fallback state.
        if (fallbackRef.current.mode !== "voice") {
          fallbackRef.current = voiceFallbackOnRecovery();
          setFallback(fallbackRef.current);
          opts.onRecovery?.();
        }
        const carry = { buf: "" };
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          parseSse(
            value,
            (data) => {
              let evt: { type?: string; audio?: string };
              try {
                evt = JSON.parse(data);
              } catch {
                return;
              }
              if (evt.type !== "speech.audio.delta" || !evt.audio) return;
              const bin = atob(evt.audio);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              playChunk(bytes);
            },
            carry,
          );
        }
        // Let the tail play out for another beat so the meter tracks the last words.
        const tail = Math.max(0, playhead - ctx!.currentTime + 0.2);
        if (tail > 0) await new Promise((r) => setTimeout(r, tail * 1000));
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.warn("HAPPY speech failed:", e);
          fallbackRef.current = voiceFallbackOnError(fallbackRef.current, e);
          setFallback(fallbackRef.current);
          opts.onFallback?.(fallbackRef.current);
        }
      } finally {
        speakingRef.current = false;
        stopMeter();
        opts.onEnd?.();
      }
    },
    [stop, stopMeter],
  );

  return { speak, stop, fallback };

}

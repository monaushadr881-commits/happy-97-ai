/**
 * HAPPY Voice Input — frontend-only VAD + Web Speech dictation.
 *
 * Two independent capabilities on top of the mic:
 *   1. VAD (voice activity detection) via a WebAudio AnalyserNode. Emits
 *      `onSpeechStart` whenever the user's voice crosses a noise-adaptive
 *      threshold. Used to interrupt HAPPY the instant the user speaks.
 *   2. Dictation via the browser's SpeechRecognition (Web Speech API).
 *      Streams interim + final transcripts back to the caller. No backend.
 *
 * Both are opt-in. The hook returns no-ops on browsers that don't support
 * the required APIs so callers stay simple.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { clearMic, publishMic } from "./audio-bus";
import { nextStateOnInterrupt, type ConvoState } from "./conversation-engine";

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type Options = {
  onSpeechStart?: () => void;                          // fires when VAD detects voice
  onTranscript?: (text: string, isFinal: boolean) => void;
  lang?: string;
  /** R110 P1 — Provides HAPPY's current convo state so the hook can compute the transition. */
  getConvoState?: () => ConvoState;
  /** R110 P1 — Called with the resulting ConvoState when the user interrupts mid-turn. */
  onInterrupt?: (next: ConvoState) => void;
};


export function useVoiceInput(opts: Options = {}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState({ vad: false, dictation: false });
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const noiseFloorRef = useRef<number>(0.02);
  const speakingRef = useRef(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const W = window as unknown as {
      webkitSpeechRecognition?: SpeechRecognitionCtor;
      SpeechRecognition?: SpeechRecognitionCtor;
    };
    setSupported({
      vad: typeof window !== "undefined" && !!window.AudioContext && !!navigator?.mediaDevices?.getUserMedia,
      dictation: !!(W.SpeechRecognition || W.webkitSpeechRecognition),
    });
  }, []);

  const stop = useCallback(() => {
    setListening(false);
    speakingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    recRef.current?.abort?.();
    recRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    clearMic();
  }, []);

  const start = useCallback(async () => {
    if (listening) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const freq = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        // RMS of centered samples → 0..1
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        // Spectral centroid → normalised 0..1 (for waveform colour hint).
        analyser.getByteFrequencyData(freq);
        let num = 0, den = 0;
        for (let i = 0; i < freq.length; i++) {
          const w = freq[i];
          num += i * w;
          den += w;
        }
        const centroid = den > 0 ? Math.min(1, (num / den) / freq.length) : 0;
        publishMic(Math.min(1, Math.pow(rms * 2.2, 0.9)), centroid);

        // Adapt noise floor slowly downward during silence.
        noiseFloorRef.current = Math.min(noiseFloorRef.current * 0.995 + rms * 0.005, 0.08);
        const threshold = Math.max(noiseFloorRef.current * 2.2, 0.035);
        const isVoice = rms > threshold;
        if (isVoice && !speakingRef.current) {
          speakingRef.current = true;
          optsRef.current.onSpeechStart?.();
        } else if (!isVoice && speakingRef.current && rms < threshold * 0.6) {
          speakingRef.current = false;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      // Web Speech dictation (best-effort)
      const W = window as unknown as {
        webkitSpeechRecognition?: SpeechRecognitionCtor;
        SpeechRecognition?: SpeechRecognitionCtor;
      };
      const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
      if (Ctor) {
        const rec = new Ctor();
        rec.lang = opts.lang ?? "en-US";
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (e) => {
          let interim = "";
          let final = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            const t = r[0]?.transcript ?? "";
            if (r.isFinal) final += t;
            else interim += t;
          }
          if (final) optsRef.current.onTranscript?.(final.trim(), true);
          else if (interim) optsRef.current.onTranscript?.(interim.trim(), false);
        };
        rec.onerror = () => { /* swallow — VAD still runs */ };
        rec.onend = () => { /* auto-restart if still listening */
          if (listening && recRef.current === rec) { try { rec.start(); } catch { /* ignore */ } }
        };
        recRef.current = rec;
        try { rec.start(); } catch { /* already started */ }
      }

      setListening(true);
    } catch {
      stop();
      throw new Error("Microphone permission was denied.");
    }
  }, [listening, opts.lang, stop]);

  useEffect(() => () => stop(), [stop]);

  return { start, stop, listening, supported };
}

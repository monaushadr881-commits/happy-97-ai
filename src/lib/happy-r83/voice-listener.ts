/**
 * R83 — Browser voice listener. Wraps the Web Speech API (built into
 * Chrome/Edge/Safari). No external streaming providers, no network calls.
 * If the browser lacks SpeechRecognition, `start()` returns false and the
 * UI falls back to text input.
 */

import { classifyIntent, isNaturalSilence, type VoiceIntent } from "./voice-intent";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

interface WindowWithSR extends Window {
  SpeechRecognition?: SR;
  webkitSpeechRecognition?: SR;
}

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as WindowWithSR;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface VoiceListenerHandlers {
  onTranscript?: (partial: string) => void;
  onIntent?: (intent: VoiceIntent) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export interface VoiceListener {
  start: () => boolean;
  stop: () => void;
  setLanguage: (code: string) => void;
}

export function createVoiceListener(handlers: VoiceListenerHandlers): VoiceListener {
  if (typeof window === "undefined") {
    return { start: () => false, stop: () => {}, setLanguage: () => {} };
  }
  const w = window as WindowWithSR;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    return { start: () => false, stop: () => {}, setLanguage: () => {} };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rec: any = null;
  let lastTokenAt = 0;
  let language = (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";
  let running = false;

  function build() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = language;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      lastTokenAt = Date.now();
      let finalText = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (interim && handlers.onTranscript) handlers.onTranscript(interim);
      if (finalText) {
        handlers.onTranscript?.(finalText);
        const intent = classifyIntent(finalText);
        handlers.onIntent?.(intent);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onerror = (e: any) => {
      handlers.onError?.(String(e?.error || "voice-error"));
    };
    r.onend = () => {
      if (running) {
        // Auto-resume for continuous conversation.
        try { r.start(); } catch { /* swallow */ }
      } else {
        handlers.onEnd?.();
      }
    };
    return r;
  }

  return {
    start: () => {
      if (running) return true;
      try {
        rec = build();
        rec.start();
        running = true;
        return true;
      } catch (err) {
        handlers.onError?.(String(err));
        return false;
      }
    },
    stop: () => {
      running = false;
      try { rec?.stop(); } catch { /* swallow */ }
    },
    setLanguage: (code: string) => {
      language = code;
      if (running) {
        try { rec?.stop(); } catch { /* swallow */ }
      }
    },
  };
  // exported for tests; keeps tree-shakable
  // (isNaturalSilence, lastTokenAt kept in scope for future silence-gap gating)
  void lastTokenAt;
  void isNaturalSilence;
}

/** Speak text using the browser's built-in speech synthesis. */
export function speak(text: string, opts?: { lang?: string; rate?: number }): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    const u = new SpeechSynthesisUtterance(text);
    if (opts?.lang) u.lang = opts.lang;
    if (opts?.rate) u.rate = opts.rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

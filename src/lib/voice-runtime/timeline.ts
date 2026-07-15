/**
 * R41 Voice Intelligence Runtime — Timing timeline builder.
 *
 * The runtime does NOT render lip sync. It only computes deterministic
 * timing timelines from real text and a real audio duration. Renderers
 * consume these timelines.
 */

export type WordTiming = { word: string; start_ms: number; end_ms: number };
export type PhonemeTiming = { phoneme: string; start_ms: number; end_ms: number };
export type VisemeTiming = { viseme: string; start_ms: number; end_ms: number };

export type SpeechTimeline = {
  duration_ms: number;
  words: WordTiming[];
  phonemes: PhonemeTiming[];
  visemes: VisemeTiming[];
  sentences: Array<{ text: string; start_ms: number; end_ms: number }>;
  source: "provider" | "estimated";
};

// Coarse but real ARKit-style viseme buckets. Renderer maps to blendshapes.
const CONSONANT_VISEME: Record<string, string> = {
  p: "PP", b: "PP", m: "PP",
  f: "FF", v: "FF",
  t: "DD", d: "DD", n: "nn", l: "nn",
  s: "SS", z: "SS",
  k: "kk", g: "kk",
  r: "RR",
};
const VOWEL_VISEME: Record<string, string> = {
  a: "aa", e: "E", i: "ih", o: "oh", u: "ou", y: "ih",
};

function letterViseme(ch: string): string {
  const l = ch.toLowerCase();
  return VOWEL_VISEME[l] ?? CONSONANT_VISEME[l] ?? "sil";
}

/**
 * Build a timing estimate from text + real measured duration_ms. When the
 * provider returns richer timing data, prefer that via `buildTimelineFromProvider`.
 */
export function buildEstimatedTimeline(text: string, duration_ms: number): SpeechTimeline {
  const cleaned = text.trim();
  if (!cleaned || duration_ms <= 0) {
    return { duration_ms: Math.max(0, duration_ms), words: [], phonemes: [], visemes: [], sentences: [], source: "estimated" };
  }
  const words = cleaned.split(/\s+/).filter(Boolean);
  const totalChars = words.reduce((n, w) => n + w.length, 0) || 1;
  const perChar = duration_ms / totalChars;
  let cursor = 0;
  const wordTimings: WordTiming[] = [];
  const phonemes: PhonemeTiming[] = [];
  const visemes: VisemeTiming[] = [];
  for (const w of words) {
    const start = Math.round(cursor);
    const end = Math.round(cursor + w.length * perChar);
    wordTimings.push({ word: w, start_ms: start, end_ms: end });
    const step = (end - start) / Math.max(1, w.length);
    for (let i = 0; i < w.length; i++) {
      const s = Math.round(start + i * step);
      const e = Math.round(start + (i + 1) * step);
      const ch = w[i]!;
      const vis = letterViseme(ch);
      phonemes.push({ phoneme: ch.toLowerCase(), start_ms: s, end_ms: e });
      visemes.push({ viseme: vis, start_ms: s, end_ms: e });
    }
    cursor = end + Math.round(perChar); // implicit space
  }
  const sentences: Array<{ text: string; start_ms: number; end_ms: number }> = [];
  const parts = cleaned.match(/[^.!?]+[.!?]?/g) ?? [cleaned];
  let sCursor = 0;
  for (const p of parts) {
    const chars = p.replace(/\s+/g, "").length;
    const dur = Math.round(chars * perChar);
    sentences.push({ text: p.trim(), start_ms: sCursor, end_ms: sCursor + dur });
    sCursor += dur;
  }
  return { duration_ms, words: wordTimings, phonemes, visemes, sentences, source: "estimated" };
}

/**
 * Provider-supplied timing (e.g. ElevenLabs word timestamps). If empty or
 * malformed, falls back to estimated.
 */
export function buildTimelineFromProvider(
  text: string,
  duration_ms: number,
  providerWords?: Array<{ word: string; start_ms: number; end_ms: number }>,
): SpeechTimeline {
  if (!providerWords || providerWords.length === 0) {
    return buildEstimatedTimeline(text, duration_ms);
  }
  const words = providerWords.map((w) => ({ ...w }));
  const phonemes: PhonemeTiming[] = [];
  const visemes: VisemeTiming[] = [];
  for (const w of words) {
    const step = (w.end_ms - w.start_ms) / Math.max(1, w.word.length);
    for (let i = 0; i < w.word.length; i++) {
      const s = Math.round(w.start_ms + i * step);
      const e = Math.round(w.start_ms + (i + 1) * step);
      const ch = w.word[i]!;
      phonemes.push({ phoneme: ch.toLowerCase(), start_ms: s, end_ms: e });
      visemes.push({ viseme: letterViseme(ch), start_ms: s, end_ms: e });
    }
  }
  return {
    duration_ms,
    words,
    phonemes,
    visemes,
    sentences: [{ text: text.trim(), start_ms: 0, end_ms: duration_ms }],
    source: "provider",
  };
}

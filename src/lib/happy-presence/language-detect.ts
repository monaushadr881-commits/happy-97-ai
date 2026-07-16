/** HPE v1.0 — lightweight script-based language detector.
 * Detects the 22 supported HPE languages. Heuristic only (no ML), never
 * modifies existing NLU/business logic. Returns best guess + confidence.
 */
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./contracts";

type Range = [number, number];
const SCRIPT_RANGES: Record<string, { ranges: Range[]; lang: SupportedLanguage }> = {
  devanagari: { ranges: [[0x0900, 0x097f]], lang: "hi" },
  bengali: { ranges: [[0x0980, 0x09ff]], lang: "bn" },
  gurmukhi: { ranges: [[0x0a00, 0x0a7f]], lang: "pa" },
  gujarati: { ranges: [[0x0a80, 0x0aff]], lang: "gu" },
  oriya: { ranges: [[0x0b00, 0x0b7f]], lang: "or" },
  tamil: { ranges: [[0x0b80, 0x0bff]], lang: "ta" },
  telugu: { ranges: [[0x0c00, 0x0c7f]], lang: "te" },
  kannada: { ranges: [[0x0c80, 0x0cff]], lang: "kn" },
  malayalam: { ranges: [[0x0d00, 0x0d7f]], lang: "ml" },
  arabic: { ranges: [[0x0600, 0x06ff]], lang: "ar" },
  cjk: { ranges: [[0x4e00, 0x9fff]], lang: "zh" },
  hiragana: { ranges: [[0x3040, 0x309f]], lang: "ja" },
  katakana: { ranges: [[0x30a0, 0x30ff]], lang: "ja" },
  hangul: { ranges: [[0xac00, 0xd7af]], lang: "ko" },
  cyrillic: { ranges: [[0x0400, 0x04ff]], lang: "ru" },
};

const LATIN_HINTS: Array<{ lang: SupportedLanguage; words: string[] }> = [
  { lang: "es", words: ["hola", "gracias", "buenos", "cómo", "está", "por favor"] },
  { lang: "fr", words: ["bonjour", "merci", "s'il", "vous", "comment"] },
  { lang: "de", words: ["hallo", "danke", "bitte", "wie", "geht"] },
];

function inRange(cp: number, ranges: Range[]) {
  return ranges.some(([a, b]) => cp >= a && cp <= b);
}

export function detectLanguage(text: string): { lang: SupportedLanguage; confidence: number } {
  const sample = (text || "").trim();
  if (!sample) return { lang: "en", confidence: 0 };

  const counts: Record<string, number> = {};
  let latin = 0;
  let total = 0;
  for (const ch of sample) {
    const cp = ch.codePointAt(0)!;
    total++;
    if (cp >= 0x41 && cp <= 0x7a) { latin++; continue; }
    for (const [name, { ranges }] of Object.entries(SCRIPT_RANGES)) {
      if (inRange(cp, ranges)) counts[name] = (counts[name] ?? 0) + 1;
    }
  }

  const scriptEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = scriptEntries[0];
  if (top && top[1] / total > 0.15) {
    const lang = SCRIPT_RANGES[top[0]].lang;
    // Devanagari + Latin ≥ threshold → Hinglish
    if (lang === "hi" && latin / total > 0.2) {
      return { lang: "hi-en", confidence: Math.min(1, (top[1] + latin) / total) };
    }
    return { lang, confidence: Math.min(1, top[1] / total + 0.1) };
  }

  const lower = sample.toLowerCase();
  for (const hint of LATIN_HINTS) {
    if (hint.words.some((w) => lower.includes(w))) {
      return { lang: hint.lang, confidence: 0.7 };
    }
  }

  // Latin-only default
  return { lang: SUPPORTED_LANGUAGES.includes("en") ? "en" : "en", confidence: latin > 0 ? 0.6 : 0.3 };
}

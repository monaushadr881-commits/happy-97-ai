/**
 * R41 Voice Intelligence Runtime — Language routing.
 *
 * Real detection with a deterministic script-based heuristic. Supports
 * English, Hindi (Devanagari), Urdu (Arabic script), and auto-detect.
 * Falls back to workspace preference then company preference.
 */

export type SupportedLanguage = "en" | "hi" | "ur" | "auto";

export function detectLanguage(text: string): SupportedLanguage {
  if (!text) return "en";
  // Devanagari block: U+0900–U+097F
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  // Arabic block covers Urdu: U+0600–U+06FF, U+0750–U+077F, U+FB50–U+FDFF
  if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF]/.test(text)) return "ur";
  return "en";
}

export type LanguagePreferences = {
  userLanguage?: SupportedLanguage | null;
  companyLanguage?: SupportedLanguage | null;
  requested?: SupportedLanguage | null;
  fallback?: SupportedLanguage;
};

export function resolveLanguage(text: string, prefs: LanguagePreferences = {}): SupportedLanguage {
  const requested = prefs.requested ?? null;
  if (requested && requested !== "auto") return requested;
  if (requested === "auto" || !requested) {
    const detected = detectLanguage(text);
    if (detected !== "en") return detected;
  }
  if (prefs.userLanguage && prefs.userLanguage !== "auto") return prefs.userLanguage;
  if (prefs.companyLanguage && prefs.companyLanguage !== "auto") return prefs.companyLanguage;
  return prefs.fallback ?? "en";
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "hi", "ur", "auto"];

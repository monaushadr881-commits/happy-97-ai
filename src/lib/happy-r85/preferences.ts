/**
 * R85 — HAPPY personalization preferences.
 *
 * Small localStorage-backed store for language, greeting style,
 * explanation level, interaction frequency and workspace behaviour.
 * Pure logic — DOM access is guarded so it works in SSR / tests.
 */

export type ExplanationLevel = "beginner" | "intermediate" | "advanced";
export type InteractionFrequency = "quiet" | "balanced" | "chatty";
export type GreetingStyle = "warm" | "professional" | "casual";
export type WorkspaceBehaviour = "adaptive" | "stay-put";

export interface HappyPreferences {
  language: string;               // BCP-47, e.g. "en-US"
  greeting: GreetingStyle;
  explanation: ExplanationLevel;
  frequency: InteractionFrequency;
  workspace: WorkspaceBehaviour;
  dismissedSuggestions: string[]; // suggestion kinds dismissed this session/permanently
}

export const DEFAULT_PREFERENCES: HappyPreferences = {
  language: "en-US",
  greeting: "warm",
  explanation: "intermediate",
  frequency: "balanced",
  workspace: "adaptive",
  dismissedSuggestions: [],
};

const STORAGE_KEY = "happy.r85.preferences.v1";

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadPreferences(): HappyPreferences {
  const s = safeStorage();
  if (!s) return { ...DEFAULT_PREFERENCES };
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<HappyPreferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: HappyPreferences): void {
  const s = safeStorage();
  if (!s) return;
  try { s.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignore quota */ }
}

export function mergePreferences(
  prev: HappyPreferences,
  patch: Partial<HappyPreferences>,
): HappyPreferences {
  return { ...prev, ...patch };
}

/**
 * Cooldown between proactive suggestions, in ms, tuned to the user's
 * interaction frequency preference. Reused by initiative + smart
 * suggestion pickers.
 */
export function suggestionCooldownMs(freq: InteractionFrequency): number {
  switch (freq) {
    case "quiet": return 180_000;
    case "chatty": return 30_000;
    default: return 90_000;
  }
}

export function greetingLead(style: GreetingStyle, hourOfDay: number): string {
  const daypart = hourOfDay < 5 ? "night" : hourOfDay < 12 ? "morning" : hourOfDay < 17 ? "afternoon" : "evening";
  switch (style) {
    case "professional": return `Good ${daypart}.`;
    case "casual": return daypart === "night" ? "Hey — still up?" : `Hey — good ${daypart}.`;
    default: return daypart === "night" ? "Working late? I'm here." : `Good ${daypart} — I'm here.`;
  }
}

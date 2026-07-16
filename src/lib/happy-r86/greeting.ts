/**
 * R86 — Signature greeting & farewell.
 *
 * Pure logic. Chooses a short, context-aware line for HAPPY's first
 * appearance in a session and for a graceful goodbye. Session-scoped
 * dedupe so we never greet twice in the same tab.
 */

import { greetingLead, type GreetingStyle } from "@/lib/happy-r85/preferences";

export type Relationship = "new" | "returning" | "familiar";

export interface GreetingContext {
  hourOfDay: number;
  style: GreetingStyle;
  relationship: Relationship;
  role?: string;             // team role hat (designer / consultant / …)
  workspace?: string;        // short workspace label (e.g. "the builder")
  displayName?: string;      // optional first name
  language?: string;         // BCP-47 (reserved for future i18n)
}

/** Compose a single-line greeting; no exclamation stacking, no repeats. */
export function composeGreeting(ctx: GreetingContext): string {
  const lead = greetingLead(ctx.style, ctx.hourOfDay);
  const who = ctx.displayName ? ` ${ctx.displayName}` : "";
  const where = ctx.workspace ? ` in ${ctx.workspace}` : "";
  const tail = ctx.role ? ` I'll be your ${ctx.role} today.` : " I'm ready when you are.";
  switch (ctx.relationship) {
    case "new":
      return `${lead}${who} — welcome${where}.${tail}`;
    case "familiar":
      return `${lead}${who} — good to see you again${where}.${tail}`;
    default:
      return `${lead}${who}${where}.${tail}`;
  }
}

/** Compose a farewell line matched to greeting style. */
export function composeFarewell(style: GreetingStyle, hourOfDay: number): string {
  const daypart = hourOfDay < 5 ? "night" : hourOfDay < 12 ? "morning" : hourOfDay < 17 ? "afternoon" : "evening";
  switch (style) {
    case "professional": return `Signing off. Have a productive ${daypart}.`;
    case "casual":       return daypart === "night" ? "Catch you later — rest well." : `Later — enjoy the ${daypart}.`;
    default:             return `I'll be at my desk if you need me. Enjoy the ${daypart}.`;
  }
}

const SESSION_KEY = "happy.r86.greeting.session.v1";

function sessionStore(): Storage | null {
  try { return typeof window !== "undefined" ? window.sessionStorage : null; } catch { return null; }
}

/** Return true once per browser session; subsequent calls return false. */
export function shouldGreetOnce(): boolean {
  const s = sessionStore();
  if (!s) return true;
  try {
    if (s.getItem(SESSION_KEY)) return false;
    s.setItem(SESSION_KEY, String(Date.now()));
    return true;
  } catch { return true; }
}

/** Testing hook — clears the once-per-session flag. */
export function resetGreetingSession(): void {
  const s = sessionStore();
  try { s?.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

/**
 * Derive relationship from a persistent visit counter stored in
 * localStorage. Increments once per calendar day per browser.
 */
const VISIT_KEY = "happy.r86.visits.v1";
export function trackAndDeriveRelationship(): Relationship {
  try {
    if (typeof window === "undefined") return "new";
    const raw = window.localStorage.getItem(VISIT_KEY);
    const today = new Date().toISOString().slice(0, 10);
    const state = raw ? (JSON.parse(raw) as { days: string[] }) : { days: [] };
    if (!state.days.includes(today)) {
      state.days = [...state.days, today].slice(-30);
      window.localStorage.setItem(VISIT_KEY, JSON.stringify(state));
    }
    const n = state.days.length;
    if (n <= 1) return "new";
    if (n < 5) return "returning";
    return "familiar";
  } catch { return "returning"; }
}

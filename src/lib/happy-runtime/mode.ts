/**
 * R39 HAPPY Runtime — Mode Runtime.
 *
 * Official operating modes for the ONE HAPPY. Every mode transition is
 * audited into `happy_mode_transitions`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HappyPersona } from "./personas";

export const HAPPY_MODES = [
  "founder", "business", "receptionist", "sales", "support",
  "research", "developer", "presentation", "meeting",
  "learning", "training", "executive",
] as const;

export type HappyMode = (typeof HAPPY_MODES)[number];

export function isMode(value: string): value is HappyMode {
  return (HAPPY_MODES as readonly string[]).includes(value);
}

/**
 * Deterministic default mode for a given persona. Callers may override.
 */
export function defaultModeForPersona(persona: HappyPersona): HappyMode {
  switch (persona) {
    case "founder": return "founder";
    case "business": return "business";
    case "receptionist": return "receptionist";
    case "sales": return "sales";
    case "support": return "support";
    case "research": return "research";
    case "presentation": return "presentation";
    case "meeting": return "meeting";
    case "teaching":
    case "learning":
      return "training";
    case "professional":
    case "friendly":
      return "business";
  }
}

export type ModeTransition = {
  session_id: string;
  from_mode: HappyMode | null;
  to_mode: HappyMode;
  reason?: string;
};

/**
 * Change a session's mode and record the transition. Returns the applied mode.
 * If `to_mode` equals current mode, the transition is a no-op (no audit row).
 */
export async function transitionMode(
  supabase: SupabaseClient,
  sessionId: string,
  toMode: HappyMode,
  reason?: string,
): Promise<{ from: HappyMode | null; to: HappyMode; changed: boolean }> {
  if (!isMode(toMode)) throw new Error(`invalid_mode:${toMode}`);
  const { data: sess, error: se } = await supabase
    .from("happy_sessions")
    .select("mode")
    .eq("id", sessionId)
    .maybeSingle();
  if (se) throw new Error(`transition_read_failed:${se.message}`);
  if (!sess) throw new Error("session_not_found");
  const from = (sess.mode as HappyMode) ?? null;
  if (from === toMode) return { from, to: toMode, changed: false };
  const { error: ue } = await supabase
    .from("happy_sessions")
    .update({ mode: toMode, last_activity_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (ue) throw new Error(`transition_update_failed:${ue.message}`);
  const { error: ie } = await supabase
    .from("happy_mode_transitions")
    .insert({ session_id: sessionId, from_mode: from, to_mode: toMode, reason });
  if (ie) throw new Error(`transition_audit_failed:${ie.message}`);
  return { from, to: toMode, changed: true };
}

/**
 * R39 HAPPY Runtime — Presence Runtime.
 *
 * Presence is a runtime state ONLY. No renderer is required. Every state
 * change writes to `happy_presence_events` and mirrors the current state
 * on the session row.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HappyPresence } from "./session";

export const HAPPY_PRESENCE_STATES: readonly HappyPresence[] = [
  "idle", "listening", "thinking", "speaking",
  "presenting", "teaching", "waiting", "busy", "offline",
];

export function isPresence(value: string): value is HappyPresence {
  return (HAPPY_PRESENCE_STATES as readonly string[]).includes(value);
}

export async function setPresence(
  supabase: SupabaseClient,
  sessionId: string,
  presence: HappyPresence,
  note?: string,
): Promise<{ presence: HappyPresence }> {
  if (!isPresence(presence)) throw new Error(`invalid_presence:${presence}`);
  const { error: ue } = await supabase
    .from("happy_sessions")
    .update({ presence, last_activity_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (ue) throw new Error(`presence_update_failed:${ue.message}`);
  const { error: ie } = await supabase
    .from("happy_presence_events")
    .insert({ session_id: sessionId, presence, note });
  if (ie) throw new Error(`presence_audit_failed:${ie.message}`);
  return { presence };
}

export async function getPresence(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<HappyPresence | null> {
  const { data, error } = await supabase
    .from("happy_sessions")
    .select("presence")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error(`presence_read_failed:${error.message}`);
  return (data?.presence as HappyPresence) ?? null;
}

/**
 * R39 HAPPY Runtime — Session Runtime.
 *
 * Manages the lifecycle of a HAPPY interaction session. A session is a real
 * DB row in `happy_sessions`, scoped by RLS to the owning user, ops admins,
 * or service_role. No fake state, no in-memory-only sessions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultPersona, isPersona, type HappyPersona } from "./personas";
import { defaultModeForPersona, isMode, type HappyMode } from "./mode";

export type HappyChannel =
  | "website" | "mobile" | "desktop" | "presentation"
  | "reception" | "meeting" | "training" | "api";

export type HappyAudience =
  | "founder" | "employee" | "customer" | "visitor" | "student" | "system";

export type HappyPresence =
  | "idle" | "listening" | "thinking" | "speaking"
  | "presenting" | "teaching" | "waiting" | "busy" | "offline";

export type StartSessionInput = {
  userId: string;
  companyId?: string;
  channel: HappyChannel;
  audience: HappyAudience;
  language?: string;
  persona?: HappyPersona;
  mode?: HappyMode;
  clientMeta?: Record<string, unknown>;
};

export type HappySessionRow = {
  id: string;
  user_id: string | null;
  channel: HappyChannel;
  audience: HappyAudience;
  persona: HappyPersona;
  mode: HappyMode;
  language: string;
  presence: HappyPresence;
  started_at: string;
  ended_at: string | null;
  last_activity_at: string;
};

export async function startSession(
  supabase: SupabaseClient,
  input: StartSessionInput,
): Promise<HappySessionRow> {
  const persona: HappyPersona =
    (input.persona && isPersona(input.persona) ? input.persona : undefined) ??
    defaultPersona(input.audience === "system" ? "employee" : input.audience, input.channel === "api" ? "website" : input.channel);
  const mode: HappyMode =
    (input.mode && isMode(input.mode) ? input.mode : undefined) ??
    defaultModeForPersona(persona);
  const { data, error } = await supabase
    .from("happy_sessions")
    .insert({
      user_id: input.userId,
      company_id: input.companyId ?? null,
      channel: input.channel,
      audience: input.audience,
      persona,
      mode,
      language: input.language ?? "en",
      presence: "idle",
      client_meta: input.clientMeta ?? {},
    })
    .select("id, user_id, channel, audience, persona, mode, language, presence, started_at, ended_at, last_activity_at")
    .single();
  if (error) throw new Error(`start_session_failed:${error.message}`);
  return data as unknown as HappySessionRow;
}

export async function endSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("happy_sessions")
    .update({ ended_at: new Date().toISOString(), presence: "offline" })
    .eq("id", sessionId);
  if (error) throw new Error(`end_session_failed:${error.message}`);
}

export async function touchSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<void> {
  await supabase
    .from("happy_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function getSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<HappySessionRow | null> {
  const { data, error } = await supabase
    .from("happy_sessions")
    .select("id, user_id, channel, audience, persona, mode, language, presence, started_at, ended_at, last_activity_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error(`get_session_failed:${error.message}`);
  return (data as unknown as HappySessionRow) ?? null;
}

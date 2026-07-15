/**
 * R39 HAPPY Runtime — Experience Runtime.
 *
 * The unified experience orchestrator. It stitches together
 *   Identity + Session + Greeting + Mode + Presence + Capability Router
 * into ONE HAPPY experience that every surface (website, mobile, desktop,
 * founder workspace, marketplace, presentation, training) can use.
 *
 * There is only ONE HAPPY. Every channel shares this runtime.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveGreeting } from "./greeting";
import { setPresence } from "./presence";
import { transitionMode, type HappyMode } from "./mode";
import { classifyIntent, recordTurn, type EvidenceItem } from "./conversation";
import { routeCapability } from "./capability-router";
import { startSession, touchSession, type HappyAudience, type HappyChannel } from "./session";

export type OpenExperienceInput = {
  userId: string;
  companyId?: string;
  channel: HappyChannel;
  audience: HappyAudience;
  language?: string;
  clientMeta?: Record<string, unknown>;
  userName?: string;
  company?: string;
  briefingSummary?: string;
};

export async function openExperience(
  supabase: SupabaseClient,
  input: OpenExperienceInput,
) {
  const session = await startSession(supabase, {
    userId: input.userId,
    companyId: input.companyId,
    channel: input.channel,
    audience: input.audience,
    language: input.language ?? "en",
    clientMeta: input.clientMeta,
  });

  const greeting = await resolveGreeting(supabase, {
    locale: session.language,
    audience: session.audience,
    channel: session.channel,
    user_name: input.userName,
    company: input.company,
    briefing_summary: input.briefingSummary,
  });

  await recordTurn(supabase, {
    sessionId: session.id,
    role: "happy",
    intent: "greeting",
    response: greeting.text,
    evidence: greeting.template_id
      ? [{ source_runtime: "happy-greetings", ref: greeting.template_id, timestamp: new Date().toISOString() }]
      : [],
  });

  return { session, greeting };
}

export type HandleMessageInput = {
  sessionId: string;
  message: string;
  requestedMode?: HappyMode;
};

export type HandleMessageResult = {
  turn_index: number;
  intent: string | null;
  capability: string | null;
  routed: {
    ok: boolean;
    runtime_route?: string;
    skill_code?: string;
    result?: unknown;
    error?: string;
  } | null;
  response: string;
  evidence: EvidenceItem[];
  latency_ms: number;
};

/**
 * Handle a single user message end-to-end:
 *  1. record user turn
 *  2. classify intent
 *  3. optionally transition mode
 *  4. route to owning runtime (never bypass ownership)
 *  5. record happy turn with evidence
 */
export async function handleMessage(
  supabase: SupabaseClient,
  input: HandleMessageInput,
): Promise<HandleMessageResult> {
  const t0 = Date.now();
  await touchSession(supabase, input.sessionId);
  await setPresence(supabase, input.sessionId, "listening");

  const userTurn = await recordTurn(supabase, {
    sessionId: input.sessionId,
    role: "user",
    message: input.message,
  });

  if (input.requestedMode) {
    await transitionMode(supabase, input.sessionId, input.requestedMode, "message_hint");
  }

  await setPresence(supabase, input.sessionId, "thinking");
  const classified = classifyIntent(input.message);
  let routed: HandleMessageResult["routed"] = null;
  let response = "";
  const evidence: EvidenceItem[] = [];

  if (classified) {
    routed = await routeCapability(supabase, { capability: classified.capability });
    if (routed.ok) {
      evidence.push({
        source_runtime: routed.runtime_route ?? "unknown",
        ref: routed.skill_code,
        timestamp: new Date().toISOString(),
        payload: routed.result,
      });
      response = `Routed to ${routed.runtime_route} (${routed.skill_code}).`;
    } else {
      response = `I recognized "${classified.intent}" but the ${classified.capability.split(".")[0]} runtime is not registered yet.`;
    }
  } else {
    response = "I heard you. I can help with CRM, finance, deployments, marketplace, briefings, and more — try asking about one of those.";
  }

  await setPresence(supabase, input.sessionId, "speaking");
  await recordTurn(supabase, {
    sessionId: input.sessionId,
    role: "happy",
    intent: classified?.intent,
    capability: classified?.capability,
    response,
    evidence,
    latencyMs: Date.now() - t0,
  });
  await setPresence(supabase, input.sessionId, "idle");

  return {
    turn_index: userTurn.turn_index,
    intent: classified?.intent ?? null,
    capability: classified?.capability ?? null,
    routed,
    response,
    evidence,
    latency_ms: Date.now() - t0,
  };
}

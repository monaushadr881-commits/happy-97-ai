/**
 * R39 HAPPY Runtime — Conversation Runtime.
 *
 * Records real turns into `happy_conversation_turns`. Every turn carries:
 *   role, intent, capability, message, response, evidence, latency, tokens.
 *
 * Business answers MUST attach `evidence` items produced by the owning
 * runtime (source_runtime + timestamp + payload). AI recommendations MUST
 * include a `confidence` in [0,1] plus supporting facts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type EvidenceItem = {
  source_runtime: string;   // e.g. "crm", "finance", "founder-workspace"
  ref?: string;             // record id / capability code
  timestamp: string;        // ISO
  payload?: unknown;
};

export type Recommendation = {
  kind: "ai";
  confidence: number;                 // 0..1
  reason: string;
  supporting_facts: EvidenceItem[];
};

export type Fact = {
  kind: "fact";
  source_runtime: string;
  timestamp: string;
  data: unknown;
};

export type TurnRole = "user" | "happy" | "system" | "tool";

export type RecordTurnInput = {
  sessionId: string;
  role: TurnRole;
  intent?: string;
  capability?: string;
  message?: string;
  response?: string;
  evidence?: EvidenceItem[];
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  error?: string;
};

async function nextTurnIndex(supabase: SupabaseClient, sessionId: string): Promise<number> {
  const { data, error } = await supabase
    .from("happy_conversation_turns")
    .select("turn_index")
    .eq("session_id", sessionId)
    .order("turn_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`turn_index_failed:${error.message}`);
  return (data?.turn_index ?? -1) + 1;
}

export async function recordTurn(
  supabase: SupabaseClient,
  input: RecordTurnInput,
): Promise<{ id: string; turn_index: number }> {
  const idx = await nextTurnIndex(supabase, input.sessionId);
  const { data, error } = await supabase
    .from("happy_conversation_turns")
    .insert({
      session_id: input.sessionId,
      turn_index: idx,
      role: input.role,
      intent: input.intent ?? null,
      capability: input.capability ?? null,
      message: input.message ?? null,
      response: input.response ?? null,
      evidence: input.evidence ?? [],
      latency_ms: input.latencyMs ?? null,
      tokens_in: input.tokensIn ?? null,
      tokens_out: input.tokensOut ?? null,
      error: input.error ?? null,
    })
    .select("id, turn_index")
    .single();
  if (error) throw new Error(`record_turn_failed:${error.message}`);
  await supabase
    .from("happy_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", input.sessionId);
  return data as { id: string; turn_index: number };
}

export async function loadHistory(
  supabase: SupabaseClient,
  sessionId: string,
  limit = 50,
): Promise<Array<{
  id: string; turn_index: number; role: TurnRole; intent: string | null;
  capability: string | null; message: string | null; response: string | null;
  evidence: EvidenceItem[]; occurred_at: string;
}>> {
  const { data, error } = await supabase
    .from("happy_conversation_turns")
    .select("id, turn_index, role, intent, capability, message, response, evidence, occurred_at")
    .eq("session_id", sessionId)
    .order("turn_index", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`load_history_failed:${error.message}`);
  return (data ?? []) as unknown as Array<{
    id: string; turn_index: number; role: TurnRole; intent: string | null;
    capability: string | null; message: string | null; response: string | null;
    evidence: EvidenceItem[]; occurred_at: string;
  }>;
}

/**
 * Deterministic intent classifier. Maps a user message to a capability
 * code owned by an existing runtime. Never fabricates capabilities that
 * aren't registered in `happy_skills`.
 */
export function classifyIntent(message: string): { intent: string; capability: string } | null {
  const m = message.toLowerCase();
  const rules: Array<[RegExp, string, string]> = [
    [/\b(lead|leads|prospect|contact)s?\b/, "crm.query", "crm.list"],
    [/\b(deal|pipeline|opportunit)/, "crm.pipeline", "crm.pipeline"],
    [/\b(invoice|revenue|cash|balance|finance|p&l|profit)/, "finance.query", "finance.summary"],
    [/\b(order|inventory|stock|erp)\b/, "erp.query", "erp.summary"],
    [/\b(deploy|deployment|release|rollback)/, "deployment.query", "deployment.list"],
    [/\b(plugin|marketplace|listing|install)/, "marketplace.query", "marketplace.search"],
    [/\b(present|slide|deck)/, "presentation.control", "presentation.next"],
    [/\b(whiteboard|draw|sketch)/, "whiteboard.control", "whiteboard.open"],
    [/\b(remind|schedule|meeting|calendar)/, "calendar.query", "calendar.upcoming"],
    [/\b(search|find|look up)/, "search.universal", "search.universal"],
    [/\b(brief|briefing|summary|status)/, "founder.brief", "founder.briefing"],
    [/\b(help|what can you do|capabilit)/, "system.help", "system.help"],
  ];
  for (const [re, intent, capability] of rules) {
    if (re.test(m)) return { intent, capability };
  }
  return null;
}

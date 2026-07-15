/**
 * R39 HAPPY Runtime — server functions.
 *
 * Auth-gated RPCs for the ONE HAPPY. All persistence goes through RLS
 * as the caller; no service_role escalation. Every RPC returns real
 * runtime data — nothing is mocked.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { endSession, getSession, startSession } from "./session";
import { setPresence, HAPPY_PRESENCE_STATES } from "./presence";
import { transitionMode, HAPPY_MODES } from "./mode";
import { loadHistory, recordTurn } from "./conversation";
import { resolveGreeting } from "./greeting";
import { handleMessage, openExperience } from "./experience";

const ChannelEnum = z.enum([
  "website","mobile","desktop","presentation","reception","meeting","training","api",
]);
const AudienceEnum = z.enum([
  "founder","employee","customer","visitor","student","system",
]);

const OpenInput = z.object({
  channel: ChannelEnum,
  audience: AudienceEnum,
  language: z.string().default("en"),
  company_id: z.string().uuid().optional(),
  client_meta: z.record(z.string(), z.unknown()).optional(),
  user_name: z.string().optional(),
  company: z.string().optional(),
  briefing_summary: z.string().optional(),
});

export const openHappyExperience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof OpenInput>) => OpenInput.parse(d))
  .handler(async ({ data, context }) => {
    return openExperience(context.supabase, {
      userId: context.userId,
      companyId: data.company_id,
      channel: data.channel,
      audience: data.audience,
      language: data.language,
      clientMeta: data.client_meta,
      userName: data.user_name,
      company: data.company,
      briefingSummary: data.briefing_summary,
    });
  });

const StartInput = OpenInput.omit({ user_name: true, company: true, briefing_summary: true });
export const startHappySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof StartInput>) => StartInput.parse(d))
  .handler(async ({ data, context }) => {
    return startSession(context.supabase, {
      userId: context.userId,
      companyId: data.company_id,
      channel: data.channel,
      audience: data.audience,
      language: data.language,
      clientMeta: data.client_meta,
    });
  });

const SessionIdInput = z.object({ session_id: z.string().uuid() });

export const endHappySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SessionIdInput>) => SessionIdInput.parse(d))
  .handler(async ({ data, context }) => {
    await endSession(context.supabase, data.session_id);
    return { ok: true };
  });

export const getHappySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SessionIdInput>) => SessionIdInput.parse(d))
  .handler(async ({ data, context }) => getSession(context.supabase, data.session_id));

const GreetInput = z.object({
  locale: z.string().default("en"),
  audience: AudienceEnum,
  channel: ChannelEnum,
  user_name: z.string().optional(),
  company: z.string().optional(),
  briefing_summary: z.string().optional(),
});

export const resolveHappyGreeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof GreetInput>) => GreetInput.parse(d))
  .handler(async ({ data, context }) =>
    resolveGreeting(context.supabase, {
      locale: data.locale,
      audience: data.audience,
      channel: data.channel,
      user_name: data.user_name,
      company: data.company,
      briefing_summary: data.briefing_summary,
    }),
  );

const MessageInput = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1).max(4000),
  requested_mode: z.enum(HAPPY_MODES).optional(),
});

export const sendHappyMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof MessageInput>) => MessageInput.parse(d))
  .handler(async ({ data, context }) => {
    const r = await handleMessage(context.supabase, {
      sessionId: data.session_id,
      message: data.message,
      requestedMode: data.requested_mode,
    });
    return r as unknown as Record<string, unknown>;
  });

const ModeInput = z.object({
  session_id: z.string().uuid(),
  to_mode: z.enum(HAPPY_MODES),
  reason: z.string().optional(),
});

export const switchHappyMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ModeInput>) => ModeInput.parse(d))
  .handler(async ({ data, context }) =>
    transitionMode(context.supabase, data.session_id, data.to_mode, data.reason),
  );

const PresenceInput = z.object({
  session_id: z.string().uuid(),
  presence: z.enum(HAPPY_PRESENCE_STATES as unknown as [string, ...string[]]),
  note: z.string().optional(),
});

export const setHappyPresence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof PresenceInput>) => PresenceInput.parse(d))
  .handler(async ({ data, context }) =>
    setPresence(context.supabase, data.session_id, data.presence as never, data.note),
  );

const HistoryInput = z.object({
  session_id: z.string().uuid(),
  limit: z.number().int().min(1).max(500).default(50),
});

export const loadHappyHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof HistoryInput>) => HistoryInput.parse(d))
  .handler(async ({ data, context }) => loadHistory(context.supabase, data.session_id, data.limit));

const RecordInput = z.object({
  session_id: z.string().uuid(),
  role: z.enum(["user","happy","system","tool"]),
  intent: z.string().optional(),
  capability: z.string().optional(),
  message: z.string().optional(),
  response: z.string().optional(),
  evidence: z.array(z.object({
    source_runtime: z.string(),
    ref: z.string().optional(),
    timestamp: z.string(),
    payload: z.unknown().optional(),
  })).optional(),
  latency_ms: z.number().int().optional(),
});

export const recordHappyTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof RecordInput>) => RecordInput.parse(d))
  .handler(async ({ data, context }) =>
    recordTurn(context.supabase, {
      sessionId: data.session_id,
      role: data.role,
      intent: data.intent,
      capability: data.capability,
      message: data.message,
      response: data.response,
      evidence: data.evidence,
      latencyMs: data.latency_ms,
    }),
  );

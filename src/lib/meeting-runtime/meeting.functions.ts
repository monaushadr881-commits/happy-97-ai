// R47 Meeting & Collaboration Runtime — orchestration layer.
// Reuses Presentation Runtime for slides/whiteboard, Notification+Automation
// runtimes for follow-ups (via automation triggers), and the CRM task runtime
// for action items with a `linked_task_id` back-reference.

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Fact, JsonValue, Recommendation } from '../happy-orchestration/json';

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)]),
);
const factSchema = z.object({
  source_runtime: z.string(), timestamp: z.string(), evidence: jsonValue, confidence: z.number().min(0).max(1),
});
const recSchema = z.object({
  reason: z.string(), confidence: z.number().min(0).max(1),
  supporting_evidence: z.array(jsonValue).default([]),
  source_runtime: z.string(), timestamp: z.string(),
});

const MEETING_TYPES = ['founder','board','executive','sales','crm','erp','finance','manufacturing','warehouse','marketplace','deployment','ai','training','customer','dealer','distributor','investor','interview'] as const;

// -------- Meetings --------------------------------------------------------
const createSchema = z.object({
  companyId: z.string().uuid().nullish(),
  workspaceId: z.string().uuid().nullish(),
  meetingType: z.enum(MEETING_TYPES),
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledStart: z.string().min(1),
  scheduledEnd: z.string().min(1),
  location: z.string().optional(),
  joinUrl: z.string().url().optional(),
  linkedPresentationSessionId: z.string().uuid().nullish(),
  metadata: z.record(z.string(), jsonValue).optional(),
});
export const createMeetingFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "createMeetingFn", source: "api", module: "meeting.createMeetingFn" });
    const { data: row, error } = await context.supabase.from('meetings').insert({
      company_id: data.companyId ?? null,
      workspace_id: data.workspaceId ?? null,
      host_id: context.userId,
      meeting_type: data.meetingType,
      title: data.title,
      description: data.description ?? null,
      scheduled_start: data.scheduledStart,
      scheduled_end: data.scheduledEnd,
      location: data.location ?? null,
      join_url: data.joinUrl ?? null,
      linked_presentation_session_id: data.linkedPresentationSessionId ?? null,
      metadata: data.metadata ?? {},
    }).select('*').single();
    if (error) throw error;
    // Auto-invite host
    await context.supabase.from('meeting_participants').insert({
      meeting_id: row.id, user_id: context.userId, role: 'host', attendance_status: 'accepted',
    });
    return row);

const statusSchema = z.object({
  meetingId: z.string().uuid(),
  status: z.enum(['scheduled','active','paused','completed','cancelled','archived']),
};
  });
export const setMeetingStatusFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => statusSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "setMeetingStatusFn", source: "api", module: "meeting.setMeetingStatusFn" });
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === 'active') patch.actual_start = new Date().toISOString();
    if (data.status === 'completed' || data.status === 'cancelled' || data.status === 'archived') {
      patch.actual_end = new Date().toISOString();
    }
    const { data: row, error } = await context.supabase.from('meetings')
      .update(patch as any).eq('id', data.meetingId).select('*').single();
    if (error) throw error;
    return row);

// -------- Participants ----------------------------------------------------
const inviteSchema = z.object({
  meetingId: z.string().uuid(),
  userId: z.string().uuid().nullish(),
  externalEmail: z.string().email().nullish(),
  displayName: z.string().optional(),
  role: z.enum(['host','presenter','participant','observer','guest']).default('participant'),
};
  });
export const inviteParticipantFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inviteSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "inviteParticipantFn", source: "api", module: "meeting.inviteParticipantFn" });
    const { data: row, error } = await context.supabase.from('meeting_participants').insert({
      meeting_id: data.meetingId,
      user_id: data.userId ?? null,
      external_email: data.externalEmail ?? null,
      display_name: data.displayName ?? null,
      role: data.role,
    }).select('*').single();
    if (error) throw error;
    return row);

const attendanceSchema = z.object({
  participantId: z.string().uuid(),
  status: z.enum(['invited','accepted','declined','tentative','joined','left','no_show']),
};
  });
export const updateAttendanceFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => attendanceSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "updateAttendanceFn", source: "api", module: "meeting.updateAttendanceFn" });
    const patch: Record<string, unknown> = { attendance_status: data.status };
    if (data.status === 'joined') patch.joined_at = new Date().toISOString();
    if (data.status === 'left') patch.left_at = new Date().toISOString();
    const { data: row, error } = await context.supabase.from('meeting_participants')
      .update(patch as any).eq('id', data.participantId).select('*').single();
    if (error) throw error;
    return row);

// -------- Agenda ----------------------------------------------------------
const agendaSchema = z.object({
  meetingId: z.string().uuid(),
  seq: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  ownerUserId: z.string().uuid().nullish(),
  durationMinutes: z.number().int().positive().optional(),
};
  });
export const addAgendaItemFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => agendaSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "addAgendaItemFn", source: "api", module: "meeting.addAgendaItemFn" });
    const { data: row, error } = await context.supabase.from('meeting_agenda_items').insert({
      meeting_id: data.meetingId, seq: data.seq, title: data.title,
      description: data.description ?? null, owner_user_id: data.ownerUserId ?? null,
      duration_minutes: data.durationMinutes ?? null, created_by: context.userId,
    }).select('*').single();
    if (error) throw error;
    return row);

const agendaStatusSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(['pending','active','completed','skipped']),
};
  });
export const setAgendaStatusFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => agendaStatusSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "setAgendaStatusFn", source: "api", module: "meeting.setAgendaStatusFn" });
    const { data: row, error } = await context.supabase.from('meeting_agenda_items')
      .update({ status: data.status }).eq('id', data.itemId).select('*').single();
    if (error) throw error;
    return row);

// -------- Minutes ---------------------------------------------------------
const minutesSchema = z.object({
  meetingId: z.string().uuid(),
  summary: z.string().optional(),
  content: jsonValue,
};
  });
export const appendMinutesVersionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => minutesSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: last } = await context.supabase.from('meeting_minutes')
      .select('version').eq('meeting_id', data.meetingId)
      .order('version', { ascending: false }).limit(1).maybeSingle();
    const version = ((last?.version as number | undefined) ?? 0) + 1;
    const { data: row, error } = await context.supabase.from('meeting_minutes').insert({
      meeting_id: data.meetingId, version, authored_by: context.userId,
      summary: data.summary ?? null, content: data.content, status: 'draft',
    }).select('*').single();
    if (error) throw error;
    return row);

const approveMinutesSchema = z.object({ minutesId: z.string().uuid() };
  });
export const approveMinutesFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => approveMinutesSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "approveMinutesFn", source: "api", module: "meeting.approveMinutesFn" });
    const { data: row, error } = await context.supabase.from('meeting_minutes')
      .update({ status: 'approved', approved_by: context.userId, approved_at: new Date().toISOString() })
      .eq('id', data.minutesId).select('*').single();
    if (error) throw error;
    return row);

// -------- Action items ----------------------------------------------------
const actionSchema = z.object({
  meetingId: z.string().uuid(),
  agendaItemId: z.string().uuid().nullish(),
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().uuid().nullish(),
  assigneeEmail: z.string().email().nullish(),
  dueAt: z.string().optional(),
  priority: z.enum(['low','medium','high','critical']).default('medium'),
  linkedTaskId: z.string().uuid().nullish(),
};
  });
export const createActionItemFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => actionSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "createActionItemFn", source: "api", module: "meeting.createActionItemFn" });
    const { data: row, error } = await context.supabase.from('meeting_action_items').insert({
      meeting_id: data.meetingId,
      agenda_item_id: data.agendaItemId ?? null,
      title: data.title,
      description: data.description ?? null,
      assignee_id: data.assigneeId ?? null,
      assignee_email: data.assigneeEmail ?? null,
      due_at: data.dueAt ?? null,
      priority: data.priority,
      created_by: context.userId,
      linked_task_id: data.linkedTaskId ?? null,
    }).select('*').single();
    if (error) throw error;
    return row);

const actionStatusSchema = z.object({
  actionId: z.string().uuid(),
  status: z.enum(['open','in_progress','blocked','done','cancelled']),
};
  });
export const setActionStatusFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => actionStatusSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "setActionStatusFn", source: "api", module: "meeting.setActionStatusFn" });
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === 'done') patch.completed_at = new Date().toISOString();
    const { data: row, error } = await context.supabase.from('meeting_action_items')
      .update(patch as any).eq('id', data.actionId).select('*').single();
    if (error) throw error;
    return row);

// -------- Decisions -------------------------------------------------------
const decSchema = z.object({
  meetingId: z.string().uuid(),
  agendaItemId: z.string().uuid().nullish(),
  decision: z.enum(['approve','reject','defer','delegate','record']),
  title: z.string().min(1),
  rationale: z.string().optional(),
  facts: z.array(factSchema).default([]),
  recommendations: z.array(recSchema).default([]),
  evidence: z.array(jsonValue).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
};
  });
export const recordMeetingDecisionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => decSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "recordMeetingDecisionFn", source: "api", module: "meeting.recordMeetingDecisionFn" });
    const { data: row, error } = await context.supabase.from('meeting_decisions').insert({
      meeting_id: data.meetingId,
      agenda_item_id: data.agendaItemId ?? null,
      decided_by: context.userId,
      decision: data.decision,
      title: data.title,
      rationale: data.rationale ?? null,
      facts: data.facts,
      recommendations: data.recommendations,
      evidence: data.evidence,
      confidence: data.confidence,
    }).select('*').single();
    if (error) throw error;
    return row);

// -------- Analytics & Follow-up ------------------------------------------
const analyticsSchema = z.object({ meetingId: z.string().uuid() };
  });
export const computeMeetingAnalyticsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => analyticsSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "computeMeetingAnalyticsFn", source: "api", module: "meeting.computeMeetingAnalyticsFn" });
    const [{ data: meeting }, { data: parts }, { data: agenda }, { data: actions }, { data: decisions }, { data: minutes }] = await Promise.all([
      context.supabase.from('meetings').select('*').eq('id', data.meetingId).single(),
      context.supabase.from('meeting_participants').select('*').eq('meeting_id', data.meetingId),
      context.supabase.from('meeting_agenda_items').select('*').eq('meeting_id', data.meetingId),
      context.supabase.from('meeting_action_items').select('*').eq('meeting_id', data.meetingId),
      context.supabase.from('meeting_decisions').select('*').eq('meeting_id', data.meetingId),
      context.supabase.from('meeting_minutes').select('*').eq('meeting_id', data.meetingId),
    ]);
    const p = parts ?? [];
    const a = agenda ?? [];
    const ai = actions ?? [];
    const attended = p.filter((x: any) => x.attendance_status === 'joined' || x.attendance_status === 'accepted').length;
    const attendanceRate = p.length ? attended / p.length : 0;
    const agendaCompletion = a.length ? a.filter((x: any) => x.status === 'completed').length / a.length : 0;
    const actionCompletion = ai.length ? ai.filter((x: any) => x.status === 'done').length / ai.length : 0;
    return {
      meeting,
      participants: p.length,
      attendance_rate: attendanceRate,
      agenda_items: a.length,
      agenda_completion: agendaCompletion,
      action_items: ai.length,
      action_completion: actionCompletion,
      decisions: (decisions ?? []).length,
      minutes_versions: (minutes ?? []).length,
    };
  });

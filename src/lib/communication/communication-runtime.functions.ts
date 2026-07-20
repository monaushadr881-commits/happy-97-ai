/**
 * R191 Batch 11 — Enterprise Communication / Notifications / Meetings / Calendar / Tasks
 *
 * SINGLE composition surface. Reuses canonical owners only:
 *   - conversations / messages           (message threading)
 *   - notifications                      (notification center)
 *   - meetings                           (schedule / reschedule / cancel)
 *   - crm_tasks                          (task assignment / status)
 *   - creator_assets                     (calendar events, notif prefs,
 *                                         communication + notification analytics)
 *   - adoptToCanonicalPipeline           (Brain session, canonical audit)
 *   - requestFounderApproval (R158)      (large cancellations / bulk notify)
 *   - writeCanonicalAudit                (audit trail)
 *
 * NO new tables, NO new runtime, NO new dashboard.
 */
import type { Database } from "@/integrations/supabase/types";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

const BULK_NOTIFY_APPROVAL_THRESHOLD = 500;

type JsonValue =
  | string | number | boolean | null
  | JsonValue[] | { [k: string]: JsonValue };
type Result = {
  status: "created" | "updated" | "cancelled" | "pending_approval" | "ok" | "recorded";
  entity_id?: string;
  approval_id?: string;
  data?: JsonValue;
};

const uuid = z.string().uuid();
const NotifChannel = z.enum(["in_app", "email", "sms", "push", "webhook"]);

// ---------------------------------------------------------------------------
// 1. Conversation create
// ---------------------------------------------------------------------------
const ConvCreateInput = z.object({
  company_id: uuid, title: z.string().min(1).max(240),
});
export const commConversationCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ConvCreateInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "conversation", capability: "create",
      user_id: userId, company_id: data.company_id, summary: data.title,
    });
    const { data: row, error } = await supabase.from("conversations")
      .insert({ user_id: userId, title: data.title })
      .select("id").single();
    if (error) throw new Error(`conversation_create_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.conversation", action: "create",
      entity_type: "conversation", entity_id: row.id, company_id: data.company_id,
      after: row, severity: "info",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 2. Message post (threading via conversation_id)
// ---------------------------------------------------------------------------
const MsgPostInput = z.object({
  company_id: uuid, conversation_id: uuid,
  role: z.enum(["user", "assistant", "system"]).default("user"),
  content: z.string().min(1).max(16000),
});
export const commMessagePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MsgPostInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "message", capability: "post",
      user_id: userId, company_id: data.company_id,
      summary: `msg ${data.conversation_id}`,
    });
    const { data: row, error } = await supabase.from("messages")
      .insert({
        conversation_id: data.conversation_id,
        user_id: userId, role: data.role, content: data.content,
      })
      .select("id").single();
    if (error) throw new Error(`message_post_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.message", action: "post",
      entity_type: "message", entity_id: row.id, company_id: data.company_id,
      after: { conversation_id: data.conversation_id }, severity: "info",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 3. Conversation list / thread read
// ---------------------------------------------------------------------------
const ThreadReadInput = z.object({
  conversation_id: uuid, limit: z.number().int().positive().max(200).default(50),
});
export const commThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ThreadReadInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", data.conversation_id)
      .order("created_at", { ascending: true }).limit(data.limit);
    if (error) throw new Error(`thread_read_failed: ${error.message}`);
    return { status: "ok", data: rows as unknown as JsonValue };
  });

// ---------------------------------------------------------------------------
// 4. Notification send (single)
// ---------------------------------------------------------------------------
const NotifSendInput = z.object({
  company_id: uuid, user_id: uuid,
  channel: NotifChannel.default("in_app"),
  kind: z.string().min(1).max(80),
  title: z.string().min(1).max(240),
  body: z.string().max(4000).optional(),
  action_url: z.string().url().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export const commNotifSend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NotifSendInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "notification", capability: "send",
      user_id: userId, company_id: data.company_id,
      summary: data.title, metadata: { channel: data.channel, kind: data.kind },
    });
    const insert: Database["public"]["Tables"]["notifications"]["Insert"] = {
      user_id: data.user_id, company_id: data.company_id,
      channel: data.channel as Database["public"]["Enums"]["notification_channel"],
      kind: data.kind, title: data.title, body: data.body ?? null,
      action_url: data.action_url ?? null,
      payload: (data.payload ?? {}) as never,
    };
    const { data: row, error } = await supabase.from("notifications")
      .insert(insert).select("id").single();
    if (error) throw new Error(`notif_send_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.notification", action: "send",
      entity_type: "notification", entity_id: row.id, company_id: data.company_id,
      after: { kind: data.kind, channel: data.channel }, severity: "info",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 5. Notification bulk send (Founder-gated above threshold)
// ---------------------------------------------------------------------------
const NotifBulkInput = z.object({
  company_id: uuid,
  user_ids: z.array(uuid).min(1).max(10_000),
  channel: NotifChannel.default("in_app"),
  kind: z.string().min(1).max(80),
  title: z.string().min(1).max(240),
  body: z.string().max(4000).optional(),
});
export const commNotifBulkSend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NotifBulkInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "notification", capability: "bulk",
      user_id: userId, company_id: data.company_id,
      summary: `bulk ${data.user_ids.length} ${data.kind}`,
    });
    if (data.user_ids.length >= BULK_NOTIFY_APPROVAL_THRESHOLD) {
      const a = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "notification",
          entity_id: crypto.randomUUID(),
          title: `Bulk notify ${data.user_ids.length} — ${data.kind}`,
          reason: "bulk_notification_threshold",
          metadata: { channel: data.channel, count: data.user_ids.length },
        } as never,
      });
      await writeCanonicalAudit(supabase, {
        category: "communication.notification", action: "bulk_pending",
        entity_type: "notification", company_id: data.company_id,
        after: { count: data.user_ids.length }, severity: "warning",
      });
      return { status: "pending_approval", approval_id: (a as { id: string }).id };
    }
    const rows: Database["public"]["Tables"]["notifications"]["Insert"][] =
      data.user_ids.map((uid) => ({
        user_id: uid, company_id: data.company_id,
        channel: data.channel as Database["public"]["Enums"]["notification_channel"],
        kind: data.kind, title: data.title, body: data.body ?? null,
        payload: {} as never,
      }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) throw new Error(`notif_bulk_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.notification", action: "bulk_send",
      entity_type: "notification", company_id: data.company_id,
      after: { count: data.user_ids.length }, severity: "notice",
    });
    return { status: "created", data: { count: data.user_ids.length } };
  });

// ---------------------------------------------------------------------------
// 6. Notification mark read
// ---------------------------------------------------------------------------
const NotifReadInput = z.object({ notification_id: uuid });
export const commNotifMarkRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NotifReadInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const { error } = await supabase.from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.notification_id);
    if (error) throw new Error(`notif_read_failed: ${error.message}`);
    return { status: "updated", entity_id: data.notification_id };
  });

// ---------------------------------------------------------------------------
// 7. Notification center (list unread)
// ---------------------------------------------------------------------------
const NotifCenterInput = z.object({
  company_id: uuid, unread_only: z.boolean().default(true),
  limit: z.number().int().positive().max(200).default(50),
});
export const commNotifCenter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NotifCenterInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    let q = supabase.from("notifications")
      .select("id, kind, title, body, channel, action_url, created_at, read_at")
      .eq("user_id", userId).eq("company_id", data.company_id)
      .order("created_at", { ascending: false }).limit(data.limit);
    if (data.unread_only) q = q.is("read_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(`notif_center_failed: ${error.message}`);
    return { status: "ok", data: rows as unknown as JsonValue };
  });

// ---------------------------------------------------------------------------
// 8. Notification preferences (creator_assets)
// ---------------------------------------------------------------------------
const NotifPrefsInput = z.object({
  company_id: uuid,
  prefs: z.record(z.string(), z.union([z.boolean(), z.string()])),
});
export const commNotifPrefsSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NotifPrefsInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "notification", capability: "prefs",
      user_id: userId, company_id: data.company_id, summary: "notif prefs",
    });
    const { data: row, error } = await supabase.from("creator_assets")
      .insert({
        creator_id: userId, kind: "communication.notif_prefs",
        title: `Notif prefs ${userId}`,
        metadata: { company_id: data.company_id, prefs: data.prefs } as never,
      } as never).select("id").single();
    if (error) throw new Error(`notif_prefs_failed: ${error.message}`);
    return { status: "recorded", entity_id: (row as { id: string }).id };
  });

// ---------------------------------------------------------------------------
// 9. Meeting schedule
// ---------------------------------------------------------------------------
const MeetingScheduleInput = z.object({
  company_id: uuid, title: z.string().min(1).max(240),
  description: z.string().max(4000).optional(),
  meeting_type: z.string().min(1).max(64).default("virtual"),
  scheduled_start: z.string().datetime(),
  scheduled_end: z.string().datetime(),
  location: z.string().max(240).optional(),
  join_url: z.string().url().optional(),
  workspace_id: uuid.optional(),
});
export const commMeetingSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MeetingScheduleInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "meeting", capability: "schedule",
      user_id: userId, company_id: data.company_id, summary: data.title,
    });
    const insert: Database["public"]["Tables"]["meetings"]["Insert"] = {
      host_id: userId, company_id: data.company_id,
      title: data.title, description: data.description ?? null,
      meeting_type: data.meeting_type,
      scheduled_start: data.scheduled_start,
      scheduled_end: data.scheduled_end,
      location: data.location ?? null, join_url: data.join_url ?? null,
      workspace_id: data.workspace_id ?? null,
      metadata: {} as never, status: "scheduled",
    };
    const { data: row, error } = await supabase.from("meetings")
      .insert(insert).select("id").single();
    if (error) throw new Error(`meeting_schedule_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.meeting", action: "schedule",
      entity_type: "meeting", entity_id: row.id, company_id: data.company_id,
      after: { title: data.title }, severity: "info",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 10. Meeting reschedule
// ---------------------------------------------------------------------------
const MeetingRescheduleInput = z.object({
  company_id: uuid, meeting_id: uuid,
  scheduled_start: z.string().datetime(),
  scheduled_end: z.string().datetime(),
});
export const commMeetingReschedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MeetingRescheduleInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "meeting", capability: "reschedule",
      user_id: userId, company_id: data.company_id,
      summary: `reschedule ${data.meeting_id}`,
    });
    const { error } = await supabase.from("meetings")
      .update({
        scheduled_start: data.scheduled_start,
        scheduled_end: data.scheduled_end, status: "scheduled",
      }).eq("id", data.meeting_id);
    if (error) throw new Error(`meeting_reschedule_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.meeting", action: "reschedule",
      entity_type: "meeting", entity_id: data.meeting_id,
      company_id: data.company_id, severity: "notice",
      after: { scheduled_start: data.scheduled_start, scheduled_end: data.scheduled_end },
    });
    return { status: "updated", entity_id: data.meeting_id };
  });

// ---------------------------------------------------------------------------
// 11. Meeting cancel
// ---------------------------------------------------------------------------
const MeetingCancelInput = z.object({
  company_id: uuid, meeting_id: uuid, reason: z.string().max(2000).optional(),
});
export const commMeetingCancel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MeetingCancelInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "meeting", capability: "cancel",
      user_id: userId, company_id: data.company_id,
      summary: `cancel ${data.meeting_id}`,
    });
    const { error } = await supabase.from("meetings")
      .update({ status: "cancelled" }).eq("id", data.meeting_id);
    if (error) throw new Error(`meeting_cancel_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.meeting", action: "cancel",
      entity_type: "meeting", entity_id: data.meeting_id,
      company_id: data.company_id, severity: "warning",
      after: { reason: data.reason ?? null },
    });
    return { status: "cancelled", entity_id: data.meeting_id };
  });

// ---------------------------------------------------------------------------
// 12. Calendar events (creator_assets, upcoming meetings + tasks)
// ---------------------------------------------------------------------------
const CalListInput = z.object({
  company_id: uuid,
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export const commCalendarList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CalListInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const from = data.from ?? new Date().toISOString();
    const to = data.to ?? new Date(Date.now() + 30 * 86400_000).toISOString();
    const [{ data: meetings }, { data: tasks }] = await Promise.all([
      supabase.from("meetings")
        .select("id, title, scheduled_start, scheduled_end, status")
        .eq("company_id", data.company_id)
        .gte("scheduled_start", from).lte("scheduled_start", to)
        .order("scheduled_start", { ascending: true }),
      supabase.from("crm_tasks")
        .select("id, title, due_at, status, priority")
        .eq("company_id", data.company_id)
        .gte("due_at", from).lte("due_at", to)
        .order("due_at", { ascending: true }),
    ]);
    return { status: "ok", data: { meetings, tasks } as unknown as JsonValue };
  });

// ---------------------------------------------------------------------------
// 13. Calendar event create (persist via creator_assets)
// ---------------------------------------------------------------------------
const CalCreateInput = z.object({
  company_id: uuid, title: z.string().min(1).max(240),
  starts_at: z.string().datetime(), ends_at: z.string().datetime(),
  location: z.string().max(240).optional(),
  notes: z.string().max(4000).optional(),
});
export const commCalendarCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CalCreateInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "calendar", capability: "create",
      user_id: userId, company_id: data.company_id, summary: data.title,
    });
    const { data: row, error } = await supabase.from("creator_assets")
      .insert({
        creator_id: userId, kind: "communication.calendar_event",
        title: data.title,
        metadata: {
          company_id: data.company_id,
          starts_at: data.starts_at, ends_at: data.ends_at,
          location: data.location ?? null, notes: data.notes ?? null,
        } as never,
      } as never).select("id").single();
    if (error) throw new Error(`calendar_create_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.calendar", action: "create",
      entity_type: "calendar_event", entity_id: (row as { id: string }).id,
      company_id: data.company_id, severity: "info",
      after: { title: data.title },
    });
    return { status: "created", entity_id: (row as { id: string }).id };
  });

// ---------------------------------------------------------------------------
// 14. Task assign (crm_tasks)
// ---------------------------------------------------------------------------
const TaskAssignInput = z.object({
  company_id: uuid, title: z.string().min(1).max(240),
  description: z.string().max(4000).optional(),
  assignee_id: uuid.optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  due_at: z.string().datetime().optional(),
  kind: z.string().max(64).default("general"),
});
export const commTaskAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TaskAssignInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "task", capability: "assign",
      user_id: userId, company_id: data.company_id, summary: data.title,
    });
    const insert: Database["public"]["Tables"]["crm_tasks"]["Insert"] = {
      company_id: data.company_id, title: data.title,
      description: data.description ?? null,
      assignee_id: data.assignee_id ?? null,
      priority: data.priority, due_at: data.due_at ?? null,
      kind: data.kind, status: "open", metadata: {} as never,
    };
    const { data: row, error } = await supabase.from("crm_tasks")
      .insert(insert).select("id").single();
    if (error) throw new Error(`task_assign_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.task", action: "assign",
      entity_type: "task", entity_id: row.id, company_id: data.company_id,
      after: { assignee_id: data.assignee_id ?? null, priority: data.priority },
      severity: "info",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 15. Task status update
// ---------------------------------------------------------------------------
const TaskStatusInput = z.object({
  company_id: uuid, task_id: uuid,
  status: z.enum(["open", "in_progress", "blocked", "done", "cancelled"]),
});
export const commTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TaskStatusInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "communication", module: "task", capability: "status",
      user_id: userId, company_id: data.company_id,
      summary: `task ${data.task_id} ${data.status}`,
    });
    const patch: Database["public"]["Tables"]["crm_tasks"]["Update"] = {
      status: data.status,
      completed_at: data.status === "done" ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("crm_tasks")
      .update(patch).eq("id", data.task_id);
    if (error) throw new Error(`task_status_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "communication.task", action: "status",
      entity_type: "task", entity_id: data.task_id,
      company_id: data.company_id, after: { status: data.status }, severity: "info",
    });
    return { status: "updated", entity_id: data.task_id };
  });

// ---------------------------------------------------------------------------
// 16. Communication analytics (messages + meetings + tasks)
// ---------------------------------------------------------------------------
const CommAnalyticsInput = z.object({
  company_id: uuid, window_days: z.number().int().positive().max(365).default(30),
});
export const commAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CommAnalyticsInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const since = new Date(Date.now() - data.window_days * 86400_000).toISOString();
    const [msgs, meets, tasks] = await Promise.all([
      supabase.from("messages").select("id", { count: "exact", head: true })
        .gte("created_at", since),
      supabase.from("meetings").select("id, status", { count: "exact" })
        .eq("company_id", data.company_id).gte("created_at", since),
      supabase.from("crm_tasks").select("id, status", { count: "exact" })
        .eq("company_id", data.company_id).gte("created_at", since),
    ]);
    const meetByStatus: Record<string, number> = {};
    for (const m of meets.data ?? []) {
      meetByStatus[m.status] = (meetByStatus[m.status] ?? 0) + 1;
    }
    const taskByStatus: Record<string, number> = {};
    for (const t of tasks.data ?? []) {
      taskByStatus[t.status] = (taskByStatus[t.status] ?? 0) + 1;
    }
    return {
      status: "ok",
      data: {
        window_days: data.window_days,
        messages_count: msgs.count ?? 0,
        meetings_total: meets.count ?? 0,
        meetings_by_status: meetByStatus,
        tasks_total: tasks.count ?? 0,
        tasks_by_status: taskByStatus,
      } as unknown as JsonValue,
    };
  });

// ---------------------------------------------------------------------------
// 17. Notification analytics (delivered / read / by channel)
// ---------------------------------------------------------------------------
const NotifAnalyticsInput = z.object({
  company_id: uuid, window_days: z.number().int().positive().max(365).default(30),
});
export const commNotifAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NotifAnalyticsInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const since = new Date(Date.now() - data.window_days * 86400_000).toISOString();
    const { data: rows, error } = await supabase.from("notifications")
      .select("channel, delivered_at, read_at")
      .eq("company_id", data.company_id).gte("created_at", since);
    if (error) throw new Error(`notif_analytics_failed: ${error.message}`);
    const byChannel: Record<string, { total: number; delivered: number; read: number }> = {};
    let total = 0, delivered = 0, read = 0;
    for (const r of rows ?? []) {
      total += 1;
      const ch = r.channel ?? "in_app";
      const b = byChannel[ch] ?? { total: 0, delivered: 0, read: 0 };
      b.total += 1;
      if (r.delivered_at) { delivered += 1; b.delivered += 1; }
      if (r.read_at) { read += 1; b.read += 1; }
      byChannel[ch] = b;
    }
    return {
      status: "ok",
      data: {
        window_days: data.window_days,
        total, delivered, read,
        delivery_rate: total ? +(delivered / total).toFixed(4) : 0,
        read_rate: delivered ? +(read / delivered).toFixed(4) : 0,
        by_channel: byChannel,
      } as unknown as JsonValue,
    };
  });

// ---------------------------------------------------------------------------
// 18. Communication health (Mission Control feed)
// ---------------------------------------------------------------------------
const CommHealthInput = z.object({ company_id: uuid });
export const commHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CommHealthInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400_000).toISOString();
    const [unread, upcoming, openTasks] = await Promise.all([
      supabase.from("notifications").select("id", { count: "exact", head: true })
        .eq("company_id", data.company_id).is("read_at", null),
      supabase.from("meetings").select("id", { count: "exact", head: true })
        .eq("company_id", data.company_id).eq("status", "scheduled")
        .gte("scheduled_start", now.toISOString()),
      supabase.from("crm_tasks").select("id", { count: "exact", head: true })
        .eq("company_id", data.company_id).in("status", ["open", "in_progress"]),
    ]);
    const { count: last24Notif } = await supabase.from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("company_id", data.company_id).gte("created_at", dayAgo);
    return {
      status: "ok",
      data: {
        unread_notifications: unread.count ?? 0,
        upcoming_meetings: upcoming.count ?? 0,
        open_tasks: openTasks.count ?? 0,
        notifications_last_24h: last24Notif ?? 0,
      } as unknown as JsonValue,
    };
  });

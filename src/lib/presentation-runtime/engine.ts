/**
 * R43 Presentation Runtime — session, slide, command, annotation, analytics.
 *
 * All persistence goes through RLS as the caller. No service_role. No renderer.
 * Every command is auditable; every annotation is versioned.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnnotationCommand, AnnotationKind, CommandChannel, CommandPayload,
  Participant, PointerCommand, PresentationMode, PresentationState,
  PresentationType, SessionCommand, SlideCommand, SlideKind, TeachingCommand,
  Transition, WhiteboardCommand, JsonValue,
} from "./contracts";

type Ctx = { userId: string };

// ---------- sessions ----------

export type CreateSessionArgs = {
  companyId?: string | null;
  happySessionId?: string | null;
  voiceSessionId?: string | null;
  presentationType: PresentationType;
  mode: PresentationMode;
  title: string;
  description?: string | null;
  participants?: Participant[];
  scheduledAt?: string | null;
  meta?: CommandPayload;
};

export async function createSession(supabase: SupabaseClient, ctx: Ctx, args: CreateSessionArgs) {
  const { data, error } = await supabase.from("presentation_sessions").insert({
    presenter_id: ctx.userId,
    company_id: args.companyId ?? null,
    happy_session_id: args.happySessionId ?? null,
    voice_session_id: args.voiceSessionId ?? null,
    presentation_type: args.presentationType,
    mode: args.mode,
    title: args.title,
    description: args.description ?? null,
    participants: (args.participants ?? []) as unknown as JsonValue,
    scheduled_at: args.scheduledAt ?? null,
    meta: (args.meta ?? {}) as JsonValue,
  }).select("*").single();
  if (error) throw error;
  await appendCommand(supabase, ctx, {
    sessionId: data.id as string,
    channel: "session",
    command: "create",
    payload: { presentation_type: args.presentationType, mode: args.mode, title: args.title },
  });
  return data;
}

export async function transitionSession(
  supabase: SupabaseClient, ctx: Ctx,
  args: { sessionId: string; command: Exclude<SessionCommand, "create"> },
) {
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  let newState: PresentationState | null = null;
  switch (args.command) {
    case "open":     newState = "waiting"; break;
    case "join":     newState = "waiting"; break;
    case "pause":    newState = "paused"; patch.paused_at = nowIso; break;
    case "resume":   newState = "presenting"; patch.resumed_at = nowIso; break;
    case "complete": newState = "finished"; patch.ended_at = nowIso; break;
    case "cancel":   newState = "cancelled"; patch.ended_at = nowIso; break;
    case "archive":  patch.archived_at = nowIso; break;
    case "state":    break;
  }
  if (newState) patch.state = newState;
  if (newState === "presenting" || newState === "waiting") patch.started_at = patch.started_at ?? nowIso;
  const { data, error } = await supabase.from("presentation_sessions")
    .update(patch).eq("id", args.sessionId).select("*").single();
  if (error) throw error;
  await appendCommand(supabase, ctx, {
    sessionId: args.sessionId, channel: "session", command: args.command,
    payload: { state: newState ?? null },
  });
  return data;
}

export async function setSessionState(
  supabase: SupabaseClient, ctx: Ctx,
  args: { sessionId: string; state: PresentationState },
) {
  const { data, error } = await supabase.from("presentation_sessions")
    .update({ state: args.state }).eq("id", args.sessionId).select("*").single();
  if (error) throw error;
  await appendCommand(supabase, ctx, {
    sessionId: args.sessionId, channel: "session", command: "state", payload: { state: args.state },
  });
  return data;
}

// ---------- slides / storyboard ----------

export type UpsertSlideArgs = {
  sessionId: string;
  slideIndex: number;
  sceneIndex?: number;
  chapter?: string | null;
  kind?: SlideKind;
  title: string;
  body?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  transition?: Transition;
  narration?: string | null;
  meta?: CommandPayload;
};

export async function upsertSlide(supabase: SupabaseClient, _ctx: Ctx, args: UpsertSlideArgs) {
  const { data, error } = await supabase.from("presentation_slides").upsert({
    session_id: args.sessionId,
    slide_index: args.slideIndex,
    scene_index: args.sceneIndex ?? 0,
    chapter: args.chapter ?? null,
    kind: args.kind ?? "slide",
    title: args.title,
    body: args.body ?? null,
    reference_type: args.referenceType ?? null,
    reference_id: args.referenceId ?? null,
    transition: args.transition ?? "cut",
    narration: args.narration ?? null,
    meta: (args.meta ?? {}) as JsonValue,
  }, { onConflict: "session_id,slide_index" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listSlides(supabase: SupabaseClient, _ctx: Ctx, sessionId: string) {
  const { data, error } = await supabase.from("presentation_slides")
    .select("*").eq("session_id", sessionId).order("slide_index");
  if (error) throw error;
  return data ?? [];
}

// ---------- commands ----------

export type AppendCommandArgs = {
  sessionId: string;
  channel: CommandChannel;
  command: SlideCommand | WhiteboardCommand | PointerCommand | SessionCommand | TeachingCommand | AnnotationCommand | string;
  targetSlideId?: string | null;
  payload?: CommandPayload;
};

export async function appendCommand(supabase: SupabaseClient, ctx: Ctx, args: AppendCommandArgs) {
  const { data: last, error: seqErr } = await supabase.from("presentation_commands")
    .select("sequence").eq("session_id", args.sessionId)
    .order("sequence", { ascending: false }).limit(1);
  if (seqErr) throw seqErr;
  const nextSeq = ((last?.[0]?.sequence as number) ?? 0) + 1;
  const { data, error } = await supabase.from("presentation_commands").insert({
    session_id: args.sessionId,
    issuer_id: ctx.userId,
    channel: args.channel,
    command: args.command,
    target_slide_id: args.targetSlideId ?? null,
    payload: (args.payload ?? {}) as JsonValue,
    sequence: nextSeq,
  }).select("*").single();
  if (error) throw error;

  if (args.channel === "slide" && args.targetSlideId) {
    await supabase.from("presentation_sessions")
      .update({ current_slide_id: args.targetSlideId })
      .eq("id", args.sessionId);
  }
  return data;
}

export async function listCommands(
  supabase: SupabaseClient, _ctx: Ctx,
  args: { sessionId: string; channel?: CommandChannel; limit?: number; sinceSequence?: number },
) {
  let q = supabase.from("presentation_commands")
    .select("*").eq("session_id", args.sessionId)
    .order("sequence", { ascending: true })
    .limit(Math.max(1, Math.min(2000, args.limit ?? 500)));
  if (args.channel) q = q.eq("channel", args.channel);
  if (typeof args.sinceSequence === "number") q = q.gt("sequence", args.sinceSequence);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// ---------- annotations ----------

export type CreateAnnotationArgs = {
  sessionId: string;
  slideId?: string | null;
  kind?: AnnotationKind;
  body: string;
  region?: CommandPayload;
};

export async function createAnnotation(supabase: SupabaseClient, ctx: Ctx, args: CreateAnnotationArgs) {
  const { data, error } = await supabase.from("presentation_annotations").insert({
    session_id: args.sessionId,
    slide_id: args.slideId ?? null,
    author_id: ctx.userId,
    kind: args.kind ?? "note",
    body: args.body,
    region: (args.region ?? {}) as JsonValue,
    version: 1,
  }).select("*").single();
  if (error) throw error;
  await supabase.from("presentation_annotation_versions").insert({
    annotation_id: data.id as string,
    version: 1,
    editor_id: ctx.userId,
    body: args.body,
    region: (args.region ?? {}) as JsonValue,
    kind: args.kind ?? "note",
    resolved: false,
    change_reason: "created",
  });
  await appendCommand(supabase, ctx, {
    sessionId: args.sessionId, channel: "annotation", command: "create",
    payload: { annotation_id: data.id as string, kind: args.kind ?? "note" },
  });
  return data;
}

export async function updateAnnotation(
  supabase: SupabaseClient, ctx: Ctx,
  args: { annotationId: string; body?: string; region?: CommandPayload; kind?: AnnotationKind; changeReason?: string },
) {
  const { data: existing, error: rErr } = await supabase.from("presentation_annotations")
    .select("*").eq("id", args.annotationId).single();
  if (rErr) throw rErr;
  const nextVersion = (existing.version as number) + 1;
  const body = args.body ?? (existing.body as string);
  const region = (args.region ?? (existing.region as CommandPayload)) as JsonValue;
  const kind = (args.kind ?? existing.kind) as AnnotationKind;

  const { data, error } = await supabase.from("presentation_annotations").update({
    body, region, kind, version: nextVersion,
  }).eq("id", args.annotationId).select("*").single();
  if (error) throw error;

  await supabase.from("presentation_annotation_versions").insert({
    annotation_id: args.annotationId,
    version: nextVersion,
    editor_id: ctx.userId,
    body, region, kind,
    resolved: existing.resolved as boolean,
    change_reason: args.changeReason ?? "edit",
  });
  await appendCommand(supabase, ctx, {
    sessionId: existing.session_id as string, channel: "annotation", command: "update",
    payload: { annotation_id: args.annotationId, version: nextVersion },
  });
  return data;
}

export async function resolveAnnotation(supabase: SupabaseClient, ctx: Ctx, annotationId: string) {
  const { data: existing, error: rErr } = await supabase.from("presentation_annotations")
    .select("*").eq("id", annotationId).single();
  if (rErr) throw rErr;
  const nextVersion = (existing.version as number) + 1;
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase.from("presentation_annotations").update({
    resolved: true, resolved_at: nowIso, resolved_by: ctx.userId, version: nextVersion,
  }).eq("id", annotationId).select("*").single();
  if (error) throw error;
  await supabase.from("presentation_annotation_versions").insert({
    annotation_id: annotationId,
    version: nextVersion,
    editor_id: ctx.userId,
    body: existing.body as string,
    region: existing.region as JsonValue,
    kind: existing.kind as string,
    resolved: true,
    change_reason: "resolved",
  });
  await appendCommand(supabase, ctx, {
    sessionId: existing.session_id as string, channel: "annotation", command: "resolve",
    payload: { annotation_id: annotationId },
  });
  return data;
}

export async function listAnnotations(
  supabase: SupabaseClient, _ctx: Ctx,
  args: { sessionId: string; slideId?: string | null; includeResolved?: boolean },
) {
  let q = supabase.from("presentation_annotations")
    .select("*").eq("session_id", args.sessionId).order("created_at", { ascending: true });
  if (args.slideId) q = q.eq("slide_id", args.slideId);
  if (!args.includeResolved) q = q.eq("resolved", false);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// ---------- analytics ----------

export async function computeAnalytics(
  supabase: SupabaseClient, ctx: Ctx,
  args: { sessionId: string; persist?: boolean },
) {
  const [{ data: session, error: sErr }, { data: slides, error: slErr }, { data: commands, error: cErr }, { data: annotations, error: aErr }] = await Promise.all([
    supabase.from("presentation_sessions").select("*").eq("id", args.sessionId).single(),
    supabase.from("presentation_slides").select("id").eq("session_id", args.sessionId),
    supabase.from("presentation_commands").select("channel, command, created_at, target_slide_id").eq("session_id", args.sessionId),
    supabase.from("presentation_annotations").select("id, kind, resolved").eq("session_id", args.sessionId),
  ]);
  if (sErr) throw sErr;
  if (slErr) throw slErr;
  if (cErr) throw cErr;
  if (aErr) throw aErr;

  const started = session.started_at ? new Date(session.started_at as string).getTime() : null;
  const ended = session.ended_at ? new Date(session.ended_at as string).getTime() : Date.now();
  const duration_ms = started ? Math.max(0, ended - started) : 0;

  const cmds = commands ?? [];
  const slidesShown = new Set<string>();
  let pointer = 0, whiteboard = 0, questions = 0, answers = 0;
  for (const c of cmds) {
    if (c.channel === "slide" && c.target_slide_id) slidesShown.add(c.target_slide_id as string);
    if (c.channel === "pointer") pointer += 1;
    if (c.channel === "whiteboard") whiteboard += 1;
    if (c.channel === "teaching" && c.command === "question") questions += 1;
    if (c.channel === "teaching" && c.command === "answer") answers += 1;
  }
  const annotationCount = (annotations ?? []).length;
  for (const a of annotations ?? []) {
    if (a.kind === "question") questions += 1;
    if (a.kind === "answer") answers += 1;
  }

  const slidesTotal = (slides ?? []).length;
  const completion = slidesTotal === 0 ? 0 : Math.min(1, slidesShown.size / slidesTotal);
  const interactions = pointer + whiteboard + annotationCount + questions + answers;
  const durationMin = Math.max(0.1, duration_ms / 60_000);
  const interactionRate = interactions / durationMin;
  const answered = questions === 0 ? 1 : Math.min(1, answers / questions);
  const teaching = Math.max(0, Math.min(1, 0.5 * completion + 0.3 * answered + 0.2 * Math.min(1, interactionRate / 5)));

  const rollup = {
    session_id: args.sessionId,
    presenter_id: session.presenter_id as string,
    company_id: session.company_id as string | null,
    window_start: (session.started_at as string) ?? (session.created_at as string),
    window_end: new Date().toISOString(),
    duration_ms,
    slides_total: slidesTotal,
    slides_shown: slidesShown.size,
    question_count: questions,
    answer_count: answers,
    annotation_count: annotationCount,
    pointer_count: pointer,
    whiteboard_command_count: whiteboard,
    interaction_rate: interactionRate,
    completion_rate: completion,
    teaching_effectiveness: teaching,
  };

  if (args.persist) {
    if (session.presenter_id !== ctx.userId) throw new Error("only the presenter can persist analytics");
    const { data, error } = await supabase.from("presentation_analytics")
      .insert(rollup).select("id").single();
    if (error) throw error;
    return { ...rollup, id: data.id as string };
  }
  return rollup;
}

// ---------- founder dashboard ----------

export async function founderDashboard(
  supabase: SupabaseClient, _ctx: Ctx,
  args: { companyId?: string | null; limit?: number },
) {
  const limit = Math.max(1, Math.min(50, args.limit ?? 20));
  let sQ = supabase.from("presentation_sessions")
    .select("id, title, presentation_type, mode, state, presenter_id, company_id, started_at, ended_at, created_at")
    .order("created_at", { ascending: false }).limit(limit);
  if (args.companyId) sQ = sQ.eq("company_id", args.companyId);
  const { data: sessions, error: sErr } = await sQ;
  if (sErr) throw sErr;

  const sessionIds = (sessions ?? []).map((s) => s.id as string);
  const { data: recentAnalytics, error: aErr } = sessionIds.length
    ? await supabase.from("presentation_analytics")
        .select("session_id, duration_ms, slides_shown, slides_total, interaction_rate, completion_rate, teaching_effectiveness, created_at")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  if (aErr) throw aErr;

  const active = (sessions ?? []).filter((s) =>
    ["waiting","presenting","teaching","question_answer","paused"].includes(s.state as string));

  return {
    fact: {
      sessions_total: (sessions ?? []).length,
      sessions_active: active.length,
      recent_sessions: sessions ?? [],
      recent_analytics: recentAnalytics ?? [],
    },
  };
}

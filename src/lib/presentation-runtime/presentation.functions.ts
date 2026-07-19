/**
 * R43 Presentation Runtime — server functions.
 * Auth-gated RPCs, RLS-scoped. No renderer. No service_role escalation.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ANNOTATION_KINDS, COMMAND_CHANNELS, POINTER_COMMANDS, PRESENTATION_MODES,
  PRESENTATION_STATES, PRESENTATION_TYPES, SESSION_COMMANDS, SLIDE_COMMANDS,
  SLIDE_KINDS, TEACHING_COMMANDS, TRANSITIONS, WHITEBOARD_COMMANDS,
} from "./contracts";
import {
  appendCommand, computeAnalytics, createAnnotation, createSession, founderDashboard,
  listAnnotations, listCommands, listSlides, resolveAnnotation, setSessionState,
  transitionSession, updateAnnotation, upsertSlide,
} from "./engine";

const TypeEnum = z.enum(PRESENTATION_TYPES);
const ModeEnum = z.enum(PRESENTATION_MODES);
const StateEnum = z.enum(PRESENTATION_STATES);
const ChannelEnum = z.enum(COMMAND_CHANNELS);
const SessionCmd = z.enum(SESSION_COMMANDS);
const SlideCmd = z.enum(SLIDE_COMMANDS);
const WhiteboardCmd = z.enum(WHITEBOARD_COMMANDS);
const PointerCmd = z.enum(POINTER_COMMANDS);
const TeachingCmd = z.enum(TEACHING_COMMANDS);
const SlideKindEnum = z.enum(SLIDE_KINDS);
const TransitionEnum = z.enum(TRANSITIONS);
const AnnotationKindEnum = z.enum(ANNOTATION_KINDS);
const Payload = z.record(z.string(), z.any());

const ParticipantSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["presenter","co_presenter","attendee","observer"]),
  display_name: z.string().max(120).optional(),
});

const CreateInput = z.object({
  company_id: z.string().uuid().nullable().optional(),
  happy_session_id: z.string().uuid().nullable().optional(),
  voice_session_id: z.string().uuid().nullable().optional(),
  presentation_type: TypeEnum,
  mode: ModeEnum,
  title: z.string().min(1).max(240),
  description: z.string().max(4000).nullable().optional(),
  participants: z.array(ParticipantSchema).max(500).optional(),
  scheduled_at: z.string().nullable().optional(),
  meta: Payload.optional(),
});
export const createSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof CreateInput>) => CreateInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "createSessionFn", source: "api", module: "presentation.createSessionFn" });
    return createSession(context.supabase, { userId: context.userId }, {
    companyId: data.company_id ?? null,
    happySessionId: data.happy_session_id ?? null,
    voiceSessionId: data.voice_session_id ?? null,
    presentationType: data.presentation_type,
    mode: data.mode,
    title: data.title,
    description: data.description ?? null,
    participants: data.participants,
    scheduledAt: data.scheduled_at ?? null,
    meta: data.meta,
  });
  });
const TransitionInput = z.object({
  session_id: z.string().uuid(),
  command: SessionCmd.exclude(["create"]),
});
export const transitionSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof TransitionInput>) => TransitionInput.parse(d))
  .handler(async ({ data, context }) => transitionSession(context.supabase, { userId: context.userId }, {
    sessionId: data.session_id, command: data.command,
  }));

const SetStateInput = z.object({ session_id: z.string().uuid(), state: StateEnum });
export const setSessionStateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SetStateInput>) => SetStateInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "setSessionStateFn", source: "api", module: "presentation.setSessionStateFn" });
    return setSessionState(context.supabase, { userId: context.userId }, {
    sessionId: data.session_id, state: data.state,
  });
  });
const UpsertSlideInput = z.object({
  session_id: z.string().uuid(),
  slide_index: z.number().int().min(0),
  scene_index: z.number().int().min(0).optional(),
  chapter: z.string().max(200).nullable().optional(),
  kind: SlideKindEnum.optional(),
  title: z.string().min(1).max(300),
  body: z.string().max(20_000).nullable().optional(),
  reference_type: z.string().max(80).nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  transition: TransitionEnum.optional(),
  narration: z.string().max(20_000).nullable().optional(),
  meta: Payload.optional(),
});
export const upsertSlideFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof UpsertSlideInput>) => UpsertSlideInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "upsertSlideFn", source: "api", module: "presentation.upsertSlideFn" });
    return upsertSlide(context.supabase, { userId: context.userId }, {
    sessionId: data.session_id,
    slideIndex: data.slide_index,
    sceneIndex: data.scene_index,
    chapter: data.chapter ?? null,
    kind: data.kind,
    title: data.title,
    body: data.body ?? null,
    referenceType: data.reference_type ?? null,
    referenceId: data.reference_id ?? null,
    transition: data.transition,
    narration: data.narration ?? null,
    meta: data.meta,
  });
  });
const ListSlidesInput = z.object({ session_id: z.string().uuid() });
export const listSlidesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListSlidesInput>) => ListSlidesInput.parse(d))
  .handler(async ({ data, context }) => listSlides(context.supabase, { userId: context.userId }, data.session_id));

const CommandUnion = z.union([SlideCmd, WhiteboardCmd, PointerCmd, TeachingCmd, SessionCmd, z.string().max(80)]);
const AppendCommandInput = z.object({
  session_id: z.string().uuid(),
  channel: ChannelEnum,
  command: CommandUnion,
  target_slide_id: z.string().uuid().nullable().optional(),
  payload: Payload.optional(),
});
export const appendCommandFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof AppendCommandInput>) => AppendCommandInput.parse(d))
  .handler(async ({ data, context }) => appendCommand(context.supabase, { userId: context.userId }, {
    sessionId: data.session_id,
    channel: data.channel,
    command: data.command as string,
    targetSlideId: data.target_slide_id ?? null,
    payload: data.payload,
  }));

const ListCommandsInput = z.object({
  session_id: z.string().uuid(),
  channel: ChannelEnum.optional(),
  limit: z.number().int().min(1).max(2000).optional(),
  since_sequence: z.number().int().min(0).optional(),
});
export const listCommandsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListCommandsInput>) => ListCommandsInput.parse(d))
  .handler(async ({ data, context }) => listCommands(context.supabase, { userId: context.userId }, {
    sessionId: data.session_id, channel: data.channel, limit: data.limit, sinceSequence: data.since_sequence,
  }));

const CreateAnnotationInput = z.object({
  session_id: z.string().uuid(),
  slide_id: z.string().uuid().nullable().optional(),
  kind: AnnotationKindEnum.optional(),
  body: z.string().min(1).max(20_000),
  region: Payload.optional(),
});
export const createAnnotationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof CreateAnnotationInput>) => CreateAnnotationInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "createAnnotationFn", source: "api", module: "presentation.createAnnotationFn" });
    return createAnnotation(context.supabase, { userId: context.userId }, {
    sessionId: data.session_id, slideId: data.slide_id ?? null, kind: data.kind, body: data.body, region: data.region,
  });
  });
const UpdateAnnotationInput = z.object({
  annotation_id: z.string().uuid(),
  body: z.string().min(1).max(20_000).optional(),
  region: Payload.optional(),
  kind: AnnotationKindEnum.optional(),
  change_reason: z.string().max(200).optional(),
});
export const updateAnnotationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof UpdateAnnotationInput>) => UpdateAnnotationInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "updateAnnotationFn", source: "api", module: "presentation.updateAnnotationFn" });
    return updateAnnotation(context.supabase, { userId: context.userId }, {
    annotationId: data.annotation_id, body: data.body, region: data.region, kind: data.kind, changeReason: data.change_reason,
  });
  });
const ResolveAnnotationInput = z.object({ annotation_id: z.string().uuid() });
export const resolveAnnotationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ResolveAnnotationInput>) => ResolveAnnotationInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "resolveAnnotationFn", source: "api", module: "presentation.resolveAnnotationFn" });
    return resolveAnnotation(context.supabase, { userId: context.userId }, data.annotation_id);
  });
const ListAnnotationsInput = z.object({
  session_id: z.string().uuid(),
  slide_id: z.string().uuid().nullable().optional(),
  include_resolved: z.boolean().optional(),
});
export const listAnnotationsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListAnnotationsInput>) => ListAnnotationsInput.parse(d))
  .handler(async ({ data, context }) => listAnnotations(context.supabase, { userId: context.userId }, {
    sessionId: data.session_id, slideId: data.slide_id ?? null, includeResolved: data.include_resolved,
  }));

const AnalyticsInput = z.object({ session_id: z.string().uuid(), persist: z.boolean().optional() });
export const analyticsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof AnalyticsInput>) => AnalyticsInput.parse(d))
  .handler(async ({ data, context }) => computeAnalytics(context.supabase, { userId: context.userId }, {
    sessionId: data.session_id, persist: data.persist ?? false,
  }));

const DashboardInput = z.object({
  company_id: z.string().uuid().nullable().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
export const founderDashboardFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof DashboardInput>) => DashboardInput.parse(d))
  .handler(async ({ data, context }) => founderDashboard(context.supabase, { userId: context.userId }, {
    companyId: data.company_id ?? null, limit: data.limit,
  }));

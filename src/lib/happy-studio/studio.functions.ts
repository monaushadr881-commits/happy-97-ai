/**
 * R51 HAPPY Studio — server functions.
 *
 * RLS enforces: reads open to authenticated users; writes restricted to
 * ops admins (founders). Version rows are immutable via trigger.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertDeploymentTransition,
  assertVersionTransition,
  buildSnapshot,
  computeSnapshotChecksum,
  type DeploymentStatus,
  type VersionStatus,
} from "./engine";

async function getIdentityId(supabase: any): Promise<string> {
  const { data, error } = await supabase.from("happy_identity").select("id").limit(1).single();
  if (error) throw error;
  return data.id;
}

// ─── Read ────────────────────────────────────────────────────────────────────

export const getHappyIdentity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const id = await getIdentityId(context.supabase);
    const snapshot = await buildSnapshot(context.supabase, id);
    return { identity_id: id, snapshot };
  });

// ─── Managers (ops only, enforced by RLS) ────────────────────────────────────

const UpdateIdentityInput = z.object({
  official_name: z.string().min(1).optional(),
  role_title: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  biography: z.string().nullable().optional(),
  mission: z.string().nullable().optional(),
  vision: z.string().nullable().optional(),
  languages: z.array(z.string()).optional(),
  primary_language: z.string().optional(),
});

export const updateIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof UpdateIdentityInput>) => UpdateIdentityInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const { data: row, error } = await context.supabase
      .from("happy_identity")
      .update({ ...data, updated_by: context.userId })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return { identity: row };
  });

export const updateAppearance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const { data: row, error } = await context.supabase
      .from("happy_appearance")
      .update(data)
      .eq("identity_id", id)
      .select("*")
      .single();
    if (error) throw error;
    return { appearance: row };
  });

const VoiceInput = z.object({
  id: z.string().uuid().optional(),
  language: z.string().min(2),
  provider: z.enum(["lovable", "openai", "gemini", "elevenlabs"]),
  voice_id: z.string().min(1),
  pitch: z.number().default(1),
  speed: z.number().default(1),
  emotion: z.string().optional(),
  pause_style: z.string().optional(),
  greeting_sample: z.string().optional(),
  business_tone: z.record(z.string(), z.unknown()).default({}),
  teaching_tone: z.record(z.string(), z.unknown()).default({}),
  founder_tone: z.record(z.string(), z.unknown()).default({}),
  is_primary: z.boolean().default(false),
});

export const upsertVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof VoiceInput>) => VoiceInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const payload = { ...data, identity_id: id };
    const { data: row, error } = data.id
      ? await context.supabase.from("happy_voice").update(payload).eq("id", data.id).select("*").single()
      : await context.supabase.from("happy_voice").insert(payload).select("*").single();
    if (error) throw error;
    return { voice: row };
  });

const BehaviorInput = z.object({
  mode: z.string().min(1),
  system_prompt: z.string().min(1),
  temperament: z.record(z.string(), z.unknown()).default({}),
  boundaries: z.array(z.string()).default([]),
  default_persona: z.boolean().default(false),
});

export const upsertBehavior = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof BehaviorInput>) => BehaviorInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const { data: row, error } = await context.supabase
      .from("happy_behavior")
      .upsert({ ...data, identity_id: id }, { onConflict: "identity_id,mode" })
      .select("*")
      .single();
    if (error) throw error;
    return { behavior: row };
  });

const SkillInput = z.object({
  skill_code: z.string().min(1),
  label: z.string().min(1),
  category: z.string().min(1),
  runtime_route: z.string().min(1),
  enabled: z.boolean().default(true),
  required_permissions: z.array(z.string()).default([]),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const upsertSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SkillInput>) => SkillInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const { data: row, error } = await context.supabase
      .from("happy_skills")
      .upsert({ ...data, identity_id: id }, { onConflict: "identity_id,skill_code" })
      .select("*")
      .single();
    if (error) throw error;
    return { skill: row };
  });

const KnowledgeInput = z.object({
  ref_type: z.enum(["document", "category", "kg_entity", "course", "memory", "policy", "product", "service"]),
  ref_id: z.string().uuid().optional(),
  ref_key: z.string().optional(),
  label: z.string().min(1),
  priority: z.number().int().default(100),
});

export const addKnowledgeRef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof KnowledgeInput>) => KnowledgeInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const { data: row, error } = await context.supabase
      .from("happy_knowledge_refs")
      .insert({ ...data, identity_id: id })
      .select("*")
      .single();
    if (error) throw error;
    return { ref: row };
  });

const AnimationInput = z.object({
  clip_code: z.string().min(1),
  label: z.string().min(1),
  category: z.enum(["idle","blink","smile","listen","talk","presentation","teaching","walk","sit","stand","gesture","custom"]),
  asset_url: z.string().url().optional(),
  asset_manifest: z.record(z.string(), z.unknown()).default({}),
  duration_ms: z.number().int().optional(),
  loops: z.boolean().default(false),
});

export const upsertAnimation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof AnimationInput>) => AnimationInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const { data: row, error } = await context.supabase
      .from("happy_animations")
      .upsert({ ...data, identity_id: id }, { onConflict: "identity_id,clip_code" })
      .select("*")
      .single();
    if (error) throw error;
    return { animation: row };
  });

// ─── Versioning ──────────────────────────────────────────────────────────────

const CreateVersionInput = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  notes: z.string().optional(),
});

export const createVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof CreateVersionInput>) => CreateVersionInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const snapshot = await buildSnapshot(context.supabase, id);
    const checksum = await computeSnapshotChecksum(snapshot);
    const { data: version, error } = await context.supabase
      .from("happy_versions")
      .insert({
        identity_id: id,
        version: data.version,
        status: "draft",
        snapshot: snapshot as unknown as Record<string, unknown>,
        checksum,
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw error;
    return { version };
  });

const TransitionInput = z.object({
  version_id: z.string().uuid(),
  to: z.enum(["draft", "review", "approved", "published", "rolled_back"]),
  notes: z.string().optional(),
});

export const transitionVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof TransitionInput>) => TransitionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: current, error: cerr } = await context.supabase
      .from("happy_versions")
      .select("*")
      .eq("id", data.version_id)
      .single();
    if (cerr) throw cerr;
    assertVersionTransition(current.status as VersionStatus, data.to);

    const patch: Record<string, unknown> = { status: data.to };
    if (data.to === "approved") {
      patch.approved_by = context.userId;
      patch.approved_at = new Date().toISOString();
    }
    if (data.to === "published") {
      patch.published_at = new Date().toISOString();
    }
    if (data.to === "rolled_back") {
      patch.rolled_back_at = new Date().toISOString();
    }

    const { data: updated, error } = await context.supabase
      .from("happy_versions")
      .update(patch)
      .eq("id", data.version_id)
      .select("*")
      .single();
    if (error) throw error;

    if (data.to === "published") {
      await context.supabase
        .from("happy_identity")
        .update({ active_version_id: updated.id, status: "published" })
        .eq("id", updated.identity_id);
    }

    return { version: updated };
  });

// ─── Deployment ──────────────────────────────────────────────────────────────

const DeployInput = z.object({
  channel: z.enum(["website", "mobile", "desktop", "founder", "presentation", "reception", "training"]),
  version_id: z.string().uuid(),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const deployToChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof DeployInput>) => DeployInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);

    const { data: version, error: verr } = await context.supabase
      .from("happy_versions")
      .select("id, status")
      .eq("id", data.version_id)
      .single();
    if (verr) throw verr;
    if (version.status !== "published" && version.status !== "approved") {
      throw new Error("only_published_or_approved_versions_can_deploy");
    }

    const { data: current } = await context.supabase
      .from("happy_deployments")
      .select("status")
      .eq("identity_id", id)
      .eq("channel", data.channel)
      .maybeSingle();

    const nextStatus: DeploymentStatus = "active";
    if (current) assertDeploymentTransition(current.status as DeploymentStatus, nextStatus);

    const { data: dep, error } = await context.supabase
      .from("happy_deployments")
      .upsert(
        {
          identity_id: id,
          channel: data.channel,
          version_id: data.version_id,
          status: nextStatus,
          config: data.config,
          deployed_by: context.userId,
          deployed_at: new Date().toISOString(),
        },
        { onConflict: "identity_id,channel" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return { deployment: dep };
  });

const RollbackDeploymentInput = z.object({
  channel: z.enum(["website", "mobile", "desktop", "founder", "presentation", "reception", "training"]),
});

export const rollbackDeployment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof RollbackDeploymentInput>) => RollbackDeploymentInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const { data: current, error: cerr } = await context.supabase
      .from("happy_deployments")
      .select("*")
      .eq("identity_id", id)
      .eq("channel", data.channel)
      .single();
    if (cerr) throw cerr;
    assertDeploymentTransition(current.status as DeploymentStatus, "rolled_back");
    const { data: dep, error } = await context.supabase
      .from("happy_deployments")
      .update({ status: "rolled_back" })
      .eq("id", current.id)
      .select("*")
      .single();
    if (error) throw error;
    return { deployment: dep };
  });

// ─── Change requests ─────────────────────────────────────────────────────────

const ChangeRequestInput = z.object({
  request_type: z.enum(["identity", "appearance", "voice", "behavior", "skills", "knowledge", "animations", "deployment"]),
  proposed_changes: z.record(z.string(), z.unknown()),
  rationale: z.string().optional(),
});

export const proposeChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ChangeRequestInput>) => ChangeRequestInput.parse(d))
  .handler(async ({ data, context }) => {
    const id = await getIdentityId(context.supabase);
    const { data: row, error } = await context.supabase
      .from("happy_change_requests")
      .insert({
        identity_id: id,
        request_type: data.request_type,
        proposed_changes: data.proposed_changes,
        rationale: data.rationale ?? null,
        requested_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw error;
    return { request: row };
  });

const ReviewInput = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
});

export const reviewChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ReviewInput>) => ReviewInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("happy_change_requests")
      .update({
        status: data.decision,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        review_notes: data.notes ?? null,
      })
      .eq("id", data.request_id)
      .select("*")
      .single();
    if (error) throw error;
    return { request: row };
  });

export const listChangeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("happy_change_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { requests: rows ?? [] };
  });

// ─── Studio overview ─────────────────────────────────────────────────────────

export const studioOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const id = await getIdentityId(context.supabase);
    const [identity, versions, deployments, pending] = await Promise.all([
      context.supabase.from("happy_identity").select("*").eq("id", id).single(),
      context.supabase
        .from("happy_versions")
        .select("id, version, status, created_at, published_at")
        .eq("identity_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      context.supabase.from("happy_deployments").select("*").eq("identity_id", id),
      context.supabase
        .from("happy_change_requests")
        .select("id")
        .eq("identity_id", id)
        .eq("status", "pending"),
    ]);
    return {
      identity: identity.data,
      versions: versions.data ?? [],
      deployments: deployments.data ?? [],
      pending_change_requests: (pending.data ?? []).length,
    };
  });

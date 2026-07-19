/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: MERGE
 * Canonical owner: src/lib/happy-r126/creator-intelligence.ts
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/**
 * HAPPY X — Creator OS API v1 (server functions)
 *
 * Rules:
 *   - Every function goes through `requireSupabaseAuth`.
 *   - RLS on creator_* tables scopes every row to auth.uid().
 *   - AI runs ONLY through the Lovable AI Gateway. Never expose LOVABLE_API_KEY.
 *   - No provider is called directly; no client-side AI keys.
 *   - Generated assets are stored via creator_assets with a data_url payload
 *     (production deployments should externalize to a storage bucket / CDN).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError } from "@/services/core/errors";
import { z } from "zod";

const uuid = z.string().uuid();
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
async function callGateway(path: string, body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("AI is busy — please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!res.ok) throw new Error(`AI Gateway error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<any>;
}

// =====================================================================
// PROJECTS
// =====================================================================
export const PROJECT_KINDS = [
  "general","image","video","voice","music","podcast","presentation",
  "document","brand","marketing","social",
] as const;

const ProjectKind = z.enum(PROJECT_KINDS);

export const creatorListProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("creator_projects")
      .select("id, kind, name, description, tags, archived, updated_at, created_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (r.error) throw r.error;
    return r.data ?? [];
  });
const CreateProject = z.object({
  kind: ProjectKind.default("general"),
  name: z.string().min(1).max(140),
  description: z.string().max(2000).optional(),
});
export const creatorCreateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateProject.parse(i))
  .handler(async ({ data, context  }) => guard(async () => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorCreateProject", source: "api", module: "creator.creatorCreateProject" });
    const r = await context.supabase.from("creator_projects")
      .insert({ user_id: context.userId, ...data })
      .select("*").single();
    if (r.error) throw r.error;
    return r.data;
export const creatorArchiveProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid, archived: z.boolean() }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorArchiveProject", source: "api", module: "creator.creatorArchiveProject" });
    return guard(async () => {
    const r = await context.supabase.from("creator_projects")
      .update({ archived: data.archived })
      .eq("id", data.id).eq("user_id", context.userId).select("*").single();
    if (r.error) throw r.error;
    return r.data;
export const creatorDeleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorDeleteProject", source: "api", module: "creator.creatorDeleteProject" });
    return guard(async () => {
    const r = await context.supabase.from("creator_projects")
      .delete().eq("id", data.id).eq("user_id", context.userId;
    if (r.error) throw r.error;
    return { ok: true };
// =====================================================================
// ASSETS
// =====================================================================
export const creatorListAssets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    kind: z.string().max(40).optional(),
    project_id: uuid.nullable().optional(),
    limit: z.number().int().min(1).max(200).default(60),
  }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorListAssets", source: "api", module: "creator.creatorListAssets" });
    return guard(async () => {
    let q = context.supabase.from("creator_assets")
      .select("id, kind, mime_type, name, data_url, external_url, width, height, duration_ms, size_bytes, prompt, model, tags, project_id, metadata, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit;
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.project_id) q = q.eq("project_id", data.project_id);
    const r = await q;
    if (r.error) throw r.error;
    return r.data ?? [];
export const creatorDeleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorDeleteAsset", source: "api", module: "creator.creatorDeleteAsset" });
    return guard(async () => {
    const r = await context.supabase.from("creator_assets")
      .delete().eq("id", data.id).eq("user_id", context.userId;
    if (r.error) throw r.error;
    return { ok: true };
async function recordGeneration(
  supabase: any, userId: string,
  args: {
    studio: string; operation: string; model?: string; prompt?: string;
    input: unknown; output_asset_id?: string | null; status?: string; error?: string;
    project_id?: string | null; duration_ms?: number;
  },
) {
  await supabase.from("creator_generations").insert({
    user_id: userId,
    project_id: args.project_id ?? null,
    studio: args.studio,
    operation: args.operation,
    model: args.model,
    prompt: args.prompt,
    input: args.input ?? {},
    output_asset_id: args.output_asset_id ?? null,
    status: args.status ?? "succeeded",
    error: args.error,
    duration_ms: args.duration_ms,
}

// =====================================================================
// IMAGE STUDIO
// =====================================================================
const IMAGE_MODELS = [
  "google/gemini-3-pro-image",
  "google/gemini-2.5-flash-image",
  "google/gemini-3.1-flash-image",
  "openai/gpt-image-2",
  "openai/gpt-image-1-mini",
] as const;

const ImageGen = z.object({
  prompt: z.string().min(3).max(4000),
  model: z.enum(IMAGE_MODELS).default("google/gemini-3-pro-image"),
  project_id: uuid.nullable().optional(),
  aspect: z.enum(["square","portrait","landscape","wide"]).default("square"),
  name: z.string().max(140).optional(),
export const creatorGenerateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ImageGen.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorGenerateImage", source: "api", module: "creator.creatorGenerateImage" });
    return guard(async () => {
    const started = Date.now();
    // Gemini image models use chat-completions image shape; OpenAI models use the OpenAI images shape.
    const isOpenAI = data.model.startsWith("openai/");
    const size = data.aspect === "portrait" ? "1024x1536"
      : data.aspect === "landscape" ? "1536x1024"
      : data.aspect === "wide" ? "1792x1024"
      : "1024x1024";

    const body = isOpenAI
      ? { model: data.model, prompt: data.prompt, size, n: 1 }
      : {
          model: data.model,
          messages: [{ role: "user", content: `${data.prompt}\n\nOutput aspect: ${data.aspect}.` }],
          modalities: ["image", "text"],
        };
    const json = await callGateway("/images/generations", body);
    const b64: string | undefined = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error("Model returned no image.");
    const dataUrl = `data:image/png;base64,${b64}`;
    const sizeBytes = Math.floor((b64.length * 3) / 4);

    const asset = await context.supabase.from("creator_assets").insert({
      user_id: context.userId,
      project_id: data.project_id ?? null,
      kind: "image",
      mime_type: "image/png",
      name: data.name || data.prompt.slice(0, 60),
      data_url: dataUrl,
      size_bytes: sizeBytes,
      prompt: data.prompt,
      model: data.model,
      metadata: { aspect: data.aspect },
    }).select("*").single();
    if (asset.error) throw asset.error;

    await recordGeneration(context.supabase, context.userId, {
      studio: "image", operation: "generate", model: data.model, prompt: data.prompt,
      input: { aspect: data.aspect }, output_asset_id: asset.data.id,
      project_id: data.project_id ?? null, duration_ms: Date.now() - started,
    return asset.data;
const ImageEdit = z.object({
  asset_id: uuid,
  prompt: z.string().min(3).max(4000),
  model: z.enum(IMAGE_MODELS).default("google/gemini-3.1-flash-image"),
  name: z.string().max(140).optional(),
export const creatorEditImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ImageEdit.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const src = await context.supabase.from("creator_assets")
      .select("*").eq("id", data.asset_id).eq("user_id", context.userId).maybeSingle();
    if (src.error) throw src.error;
    if (!src.data) throw new Error("Source asset not found");
    const srcUrl = (src.data.data_url as string | null) ?? (src.data.external_url as string | null);
    if (!srcUrl) throw new Error("Source asset has no image data");

    // All supported edit models are Gemini image models (chat shape with image_url part).
    const body = {
      model: data.model,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: data.prompt },
          { type: "image_url", image_url: { url: srcUrl } },
        ],
      }],
      modalities: ["image", "text"],
    };
    const json = await callGateway("/images/generations", body);
    const b64: string | undefined = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error("Model returned no image.");
    const dataUrl = `data:image/png;base64,${b64}`;

    const asset = await context.supabase.from("creator_assets").insert({
      user_id: context.userId,
      project_id: src.data.project_id,
      kind: "image",
      mime_type: "image/png",
      name: data.name || `Edited — ${(src.data.name as string).slice(0, 40)}`,
      data_url: dataUrl,
      prompt: data.prompt,
      model: data.model,
      metadata: { edited_from: data.asset_id },
    }).select("*").single();
    if (asset.error) throw asset.error;

    await recordGeneration(context.supabase, context.userId, {
      studio: "image", operation: "edit", model: data.model, prompt: data.prompt,
      input: { asset_id: data.asset_id }, output_asset_id: asset.data.id,
      project_id: src.data.project_id,
    return asset.data;
// =====================================================================
// VOICE STUDIO (TTS via /v1/audio/speech)
// =====================================================================
const Tts = z.object({
  input: z.string().min(1).max(4000),
  voice: z.string().max(40).default("alloy"),
  model: z.enum(["openai/gpt-4o-mini-tts"]).default("openai/gpt-4o-mini-tts"),
  format: z.enum(["mp3","wav","opus","aac","flac"]).default("mp3"),
  project_id: uuid.nullable().optional(),
  name: z.string().max(140).optional(),
export const creatorTts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Tts.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const res = await fetch(`${GATEWAY}/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: data.model, input: data.input, voice: data.voice, response_format: data.format,
      }),
    if (!res.ok) throw new Error(`AI Gateway error ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    // base64 encode without Buffer (Worker-safe)
    let bin = ""; for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);
    const mime = data.format === "mp3" ? "audio/mpeg" : `audio/${data.format}`;
    const dataUrl = `data:${mime};base64,${b64}`;

    const asset = await context.supabase.from("creator_assets").insert({
      user_id: context.userId,
      project_id: data.project_id ?? null,
      kind: "audio",
      mime_type: mime,
      name: data.name || data.input.slice(0, 60),
      data_url: dataUrl,
      size_bytes: buf.length,
      prompt: data.input,
      model: data.model,
      metadata: { voice: data.voice, format: data.format },
    }).select("*").single();
    if (asset.error) throw asset.error;

    await recordGeneration(context.supabase, context.userId, {
      studio: "voice", operation: "tts", model: data.model, prompt: data.input,
      input: { voice: data.voice, format: data.format }, output_asset_id: asset.data.id,
      project_id: data.project_id ?? null,
    return asset.data;
// =====================================================================
// COPY / MARKETING / DOCUMENT STUDIO — text generation
// =====================================================================
const Copy = z.object({
  studio: z.enum(["copy","marketing","document","social"]).default("copy"),
  brief: z.string().min(3).max(4000),
  audience: z.string().max(200).optional(),
  tone: z.string().max(80).optional(),
  format: z.enum(["ad","email","social","blog","landing","script","press_release","product_description"]).default("ad"),
  brand_kit_id: uuid.nullable().optional(),
  project_id: uuid.nullable().optional(),
export const creatorGenerateCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Copy.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorGenerateCopy", source: "api", module: "creator.creatorGenerateCopy" });
    return guard(async () => {
    let brand: any = null;
    if (data.brand_kit_id) {
      const r = await context.supabase.from("creator_brand_kits")
        .select("*").eq("id", data.brand_kit_id).eq("user_id", context.userId).maybeSingle();
      brand = r.data;
    }
    const sys = [
      "You are HAPPY in Creator Assistant mode.",
      "Write in a single voice; do not include instructions or meta-commentary.",
      brand?.voice_guide ? `Brand voice: ${brand.voice_guide}` : "",
      data.tone ? `Tone: ${data.tone}.` : "",
      data.audience ? `Audience: ${data.audience}.` : "",
      `Format: ${data.format}. Return clean markdown only.`,
    ].filter(Boolean).join(" ");

    const json = await callGateway("/chat/completions", {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: data.brief },
      ],
    const text = (json?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error("Model returned no text.");

    const asset = await context.supabase.from("creator_assets").insert({
      user_id: context.userId,
      project_id: data.project_id ?? null,
      kind: "document",
      mime_type: "text/markdown",
      name: data.brief.slice(0, 60),
      data_url: `data:text/markdown;base64,${btoa(unescape(encodeURIComponent(text)))}`,
      prompt: data.brief,
      model: "google/gemini-2.5-flash",
      metadata: { format: data.format, tone: data.tone ?? null, audience: data.audience ?? null, text },
    }).select("*").single();
    if (asset.error) throw asset.error;

    await recordGeneration(context.supabase, context.userId, {
      studio: data.studio, operation: "copy", model: "google/gemini-2.5-flash", prompt: data.brief,
      input: { format: data.format, tone: data.tone, audience: data.audience },
      output_asset_id: asset.data.id, project_id: data.project_id ?? null,
    return { ...asset.data, text };
// =====================================================================
// PRESENTATION STUDIO — generate a deck (structured JSON)
// =====================================================================
const Slides = z.object({
  title: z.string().min(3).max(200),
  audience: z.string().max(200).optional(),
  outline: z.string().min(5).max(4000),
  slide_count: z.number().int().min(3).max(30).default(10),
  project_id: uuid.nullable().optional(),
export const creatorGenerateSlides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Slides.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorGenerateSlides", source: "api", module: "creator.creatorGenerateSlides" });
    return guard(async () => {
    const prompt = `Build a ${data.slide_count}-slide presentation.
Title: ${data.title}
Audience: ${data.audience ?? "general professional"}
Outline: ${data.outline}
Return STRICT JSON only, no prose, no code fences:
{"slides":[{"title":"...","bullets":["...","..."],"narration":"one short spoken paragraph"}]}`;
    const json = await callGateway("/chat/completions", {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    };
    const raw = (json?.choices?.[0]?.message?.content ?? "").trim();
    const match = raw.match(/```json\s*([\s\S]*?)```/i) ?? raw.match(/(\{[\s\S]*\})/);
    let slides: unknown = [];
    try { slides = JSON.parse((match?.[1] ?? raw).trim()).slides ?? []; } catch { slides = []; }
    const parsed = z.array(z.object({
      title: z.string().max(200),
      bullets: z.array(z.string().max(300)).max(10).default([]),
      narration: z.string().max(1400).default(""),
    })).max(30).safeParse(slides);
    const clean = parsed.success ? parsed.data : [];

    const asset = await context.supabase.from("creator_assets").insert({
      user_id: context.userId,
      project_id: data.project_id ?? null,
      kind: "slide_deck",
      mime_type: "application/json",
      name: data.title,
      prompt: data.outline,
      model: "google/gemini-2.5-flash",
      metadata: { slides: clean, audience: data.audience ?? null },
    }).select("*").single();
    if (asset.error) throw asset.error;

    await recordGeneration(context.supabase, context.userId, {
      studio: "presentation", operation: "slides", model: "google/gemini-2.5-flash",
      prompt: data.outline, input: { slide_count: data.slide_count, audience: data.audience },
      output_asset_id: asset.data.id, project_id: data.project_id ?? null,
    return asset.data;
// =====================================================================
// BRAND STUDIO
// =====================================================================
export const creatorListBrandKits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("creator_brand_kits")
      .select("*").eq("user_id", context.userId).order("updated_at", { ascending: false });
    if (r.error) throw r.error;
    return r.data ?? [];
const BrandUpsert = z.object({
  id: uuid.optional(),
  name: z.string().min(1).max(120),
  primary_color: z.string().max(20).optional(),
  secondary_color: z.string().max(20).optional(),
  accent_color: z.string().max(20).optional(),
  heading_font: z.string().max(80).optional(),
  body_font: z.string().max(80).optional(),
  voice_guide: z.string().max(2000).optional(),
  is_default: z.boolean().optional(),
export const creatorSaveBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => BrandUpsert.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorSaveBrandKit", source: "api", module: "creator.creatorSaveBrandKit" });
    return guard(async () => {
    const payload = { ...data, user_id: context.userId, updated_at: new Date().toISOString() };
    const r = data.id
      ? await context.supabase.from("creator_brand_kits").update(payload)
          .eq("id", data.id).eq("user_id", context.userId).select("*").single()
      : await context.supabase.from("creator_brand_kits").insert(payload).select("*").single();
    if (r.error) throw r.error;
    return r.data;
export const creatorDeleteBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "creatorDeleteBrandKit", source: "api", module: "creator.creatorDeleteBrandKit" });
    return guard(async () => {
    const r = await context.supabase.from("creator_brand_kits")
      .delete().eq("id", data.id).eq("user_id", context.userId;
    if (r.error) throw r.error;
    return { ok: true };
// =====================================================================
// DASHBOARD / STATS
// =====================================================================
export const creatorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const s = context.supabase;
    const [projects, assets, gens, recent] = await Promise.all([
      s.from("creator_projects").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
      s.from("creator_assets").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
      s.from("creator_generations").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
      s.from("creator_generations")
        .select("id, studio, operation, status, model, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    return {
      total_projects: projects.count ?? 0,
      total_assets: assets.count ?? 0,
      total_generations: gens.count ?? 0,
      recent: recent.data ?? [],
    };
export const creatorRecentGenerations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    studio: z.string().max(40).optional(),
    limit: z.number().int().min(1).max(100).default(30),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("creator_generations")
      .select("id, studio, operation, model, status, prompt, output_asset_id, created_at, duration_ms")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.studio) q = q.eq("studio", data.studio);
    const r = await q;
    if (r.error) throw r.error;
    return r.data ?? [];
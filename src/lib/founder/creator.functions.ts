/**
 * R183 Batch I — Canonical Founder Creator Runtime
 *
 * SINGLE canonical server-function surface that routes a Founder-initiated
 * Creator generation through the full pipeline:
 *
 *   Founder request
 *     → withBrain (capability: founder.creator.generate)
 *     → runBrain / impact analysis (kind, model, cost heuristic)
 *     → (optional) Executive Review — hooked via approval metadata; the
 *        existing Executive Board runtime (Batch H) can attach a review
 *        via decideFounderApproval + recordBoardOutcome.
 *     → requestFounderApproval (R158 → public.approvals)
 *     → Founder decides via decideFounderApproval
 *     → writeCanonicalAudit (request)
 *     → Finalise → generate via Lovable AI Gateway (existing canonical
 *        Creator generation shapes: images / audio / text / slides)
 *     → INSERT versioned row into public.creator_assets
 *     → INSERT into public.creator_generations (existing log)
 *     → writeCanonicalAudit (finalise)
 *     → Mission Control reads via creator_assets + approvals + audit_logs
 *
 * DOES NOT create: new tables, new asset store, new generator, new AI
 * runtime, new dashboard, new approval / audit engine, new V2. Reuses the
 * existing Creator Runtime shape (see src/lib/creator-v1.functions.ts —
 * same gateway path, same asset row schema, same generations log).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "./audit";
import { withBrain } from "./with-brain";

const CAPABILITY = "founder.creator.generate" as const;
const APPROVAL_ENTITY = "founder_creator_generation" as const;
const ASSET_SOURCE = "founder.creator.finalize" as const;
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

// Kinds the Founder pipeline accepts. Each maps onto an existing
// canonical Creator generation shape.
export const FOUNDER_CREATOR_KINDS = [
  "image",
  "audio",
  "document",
  "presentation",
  "marketing",
  "social",
  "brand",
  "video",
] as const;
export type FounderCreatorKind = (typeof FOUNDER_CREATOR_KINDS)[number];

const EXECUTIVE_REQUIRED_KINDS = new Set<FounderCreatorKind>([
  "marketing",
  "social",
  "brand",
  "video",
]);

// ---------- Request ----------

export interface FounderCreatorContent {
  prompt: string;
  model?: string;
  aspect?: "square" | "portrait" | "landscape" | "wide";
  voice?: string;
  format?: string;
  slide_count?: number;
  audience?: string;
  tone?: string;
  brand_kit_id?: string | null;
  extras?: Record<string, unknown>;
}

interface RequestInput {
  company_id: string;
  kind: FounderCreatorKind;
  name: string;
  content: FounderCreatorContent;
  reason?: string;
  executive_review?: boolean;
}

function isKind(v: unknown): v is FounderCreatorKind {
  return (
    typeof v === "string" &&
    (FOUNDER_CREATOR_KINDS as readonly string[]).includes(v)
  );
}

function validateRequest(input: unknown): RequestInput {
  const v = input as Partial<RequestInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.company_id || typeof v.company_id !== "string")
    throw new Error("company_id_required");
  if (!isKind(v.kind)) throw new Error("kind_invalid");
  if (!v.name || typeof v.name !== "string") throw new Error("name_required");
  const c = v.content as FounderCreatorContent | undefined;
  if (!c || typeof c !== "object" || !c.prompt || typeof c.prompt !== "string")
    throw new Error("content_prompt_required");
  return {
    company_id: v.company_id,
    kind: v.kind,
    name: v.name,
    content: c,
    reason: typeof v.reason === "string" ? v.reason : undefined,
    executive_review:
      typeof v.executive_review === "boolean" ? v.executive_review : undefined,
  };
}

/** Impact analysis — pure. Brain step. */
function analyseImpact(input: RequestInput) {
  const p = input.content.prompt.trim();
  const size = p.length;
  const cost_units =
    input.kind === "video"
      ? 20
      : input.kind === "image"
        ? 4
        : input.kind === "audio"
          ? 2
          : input.kind === "presentation"
            ? 3
            : 1;
  const risk =
    EXECUTIVE_REQUIRED_KINDS.has(input.kind) || size > 1200
      ? "elevated"
      : "standard";
  return {
    kind: input.kind,
    prompt_chars: size,
    cost_units,
    executive_review_required:
      EXECUTIVE_REQUIRED_KINDS.has(input.kind) ||
      input.executive_review === true,
    risk,
  };
}

/**
 * Step 1 — Founder submits a Creator generation request. Runs Brain
 * (impact analysis) and creates an R158 approval row.
 */
export const requestCreatorGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateRequest)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const brain = withBrain<RequestInput, ReturnType<typeof analyseImpact>>({
      capability: CAPABILITY,
      handler: (input) => analyseImpact(input),
    });
    const brainResult = await brain({
      capability: CAPABILITY,
      input: data,
      context: { isFounder: true, approvalGranted: true },
    });

    const { data: row, error } = await supabase
      .from("approvals")
      .insert({
        company_id: data.company_id,
        entity_type: APPROVAL_ENTITY,
        entity_id: crypto.randomUUID(),
        title: `Creator · ${data.kind} · ${data.name}`,
        reason: data.reason ?? null,
        requested_by: userId,
        status: "pending",
        metadata: {
          capability: CAPABILITY,
          kind: data.kind,
          name: data.name,
          content: data.content,
          impact: brainResult.output,
          brain_duration_ms: brainResult.durationMs,
        } as never,
      })
      .select("id, status, entity_id")
      .single();
    if (error) throw new Error(`approval_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "founder.creator",
      action: "request",
      entity_type: APPROVAL_ENTITY,
      entity_id: row.entity_id as string,
      company_id: data.company_id,
      after: { approval_id: row.id, impact: brainResult.output },
      severity: "notice",
      metadata: {
        capability: CAPABILITY,
        kind: data.kind,
        name: data.name,
      },
    });

    return {
      approval_id: row.id as string,
      generation_id: row.entity_id as string,
      status: row.status as string,
      impact: brainResult.output,
    };
  });

// ---------- Finalise ----------

interface FinaliseInput {
  approval_id: string;
}

function validateFinalise(input: unknown): FinaliseInput {
  const v = input as Partial<FinaliseInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.approval_id || typeof v.approval_id !== "string")
    throw new Error("approval_id_required");
  return { approval_id: v.approval_id };
}

async function callGateway(path: string, body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("AI is busy — retry shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted.");
  if (!res.ok)
    throw new Error(`AI Gateway error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

interface GeneratedPayload {
  mime_type: string;
  data_url: string;
  size_bytes: number;
  model: string;
  studio: string;
  operation: string;
  extra?: Record<string, unknown>;
}

function b64utf8(s: string): string {
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(s)));
  return Buffer.from(s, "utf-8").toString("base64");
}

async function runGeneration(
  kind: FounderCreatorKind,
  content: FounderCreatorContent,
): Promise<GeneratedPayload> {
  if (kind === "image") {
    const model = content.model || "google/gemini-3-pro-image";
    const aspect = content.aspect ?? "square";
    const isOpenAI = model.startsWith("openai/");
    const size =
      aspect === "portrait" ? "1024x1536"
      : aspect === "landscape" ? "1536x1024"
      : aspect === "wide" ? "1792x1024"
      : "1024x1024";
    const body = isOpenAI
      ? { model, prompt: content.prompt, size, n: 1 }
      : {
          model,
          messages: [{ role: "user", content: `${content.prompt}\n\nOutput aspect: ${aspect}.` }],
          modalities: ["image", "text"],
        };
    const res = await callGateway("/images/generations", body);
    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error("Model returned no image.");
    return {
      mime_type: "image/png",
      data_url: `data:image/png;base64,${b64}`,
      size_bytes: Math.floor((b64.length * 3) / 4),
      model,
      studio: "image",
      operation: "generate",
      extra: { aspect },
    };
  }

  if (kind === "audio") {
    const model = content.model || "openai/gpt-4o-mini-tts";
    const voice = content.voice || "alloy";
    const format = content.format || "mp3";
    const res = await callGateway("/audio/speech", {
      model,
      input: content.prompt,
      voice,
      response_format: format,
    });
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);
    const mime = format === "mp3" ? "audio/mpeg" : `audio/${format}`;
    return {
      mime_type: mime,
      data_url: `data:${mime};base64,${b64}`,
      size_bytes: buf.length,
      model,
      studio: "voice",
      operation: "tts",
      extra: { voice, format },
    };
  }

  if (kind === "presentation") {
    const model = content.model || "google/gemini-2.5-flash";
    const slideCount = Math.max(3, Math.min(30, content.slide_count ?? 10));
    const prompt = `Build a ${slideCount}-slide presentation.
Audience: ${content.audience ?? "general professional"}
Outline: ${content.prompt}
Return STRICT JSON only:
{"slides":[{"title":"...","bullets":["..."],"narration":"..."}]}`;
    const res = await callGateway("/chat/completions", {
      model,
      messages: [{ role: "user", content: prompt }],
    });
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = (json?.choices?.[0]?.message?.content ?? "").trim();
    const match = raw.match(/```json\s*([\s\S]*?)```/i) ?? raw.match(/(\{[\s\S]*\})/);
    let slides: unknown = [];
    try {
      slides = JSON.parse((match?.[1] ?? raw).trim()).slides ?? [];
    } catch {
      slides = [];
    }
    const body = JSON.stringify({ slides }, null, 2);
    return {
      mime_type: "application/json",
      data_url: `data:application/json;base64,${b64utf8(body)}`,
      size_bytes: new TextEncoder().encode(body).length,
      model,
      studio: "presentation",
      operation: "slides",
      extra: { slide_count: slideCount },
    };
  }

  if (kind === "video") {
    // Video generation is BLOCKED external per Core Vision Lock.
    // Emit a canonical placeholder brief so downstream tooling knows
    // exactly what to hand to the external provider.
    const brief = JSON.stringify(
      {
        kind: "video_brief",
        status: "external_blocked",
        prompt: content.prompt,
        model_requested: content.model ?? "unset",
        note: "Video rendering is external / BLOCKED per Core Vision Lock. This asset stores the approved brief only.",
      },
      null,
      2,
    );
    return {
      mime_type: "application/json",
      data_url: `data:application/json;base64,${b64utf8(brief)}`,
      size_bytes: new TextEncoder().encode(brief).length,
      model: content.model || "external/video-provider",
      studio: "video",
      operation: "brief",
      extra: { external_blocked: true },
    };
  }

  // document / marketing / social / brand → text generation
  const model = content.model || "google/gemini-2.5-flash";
  const sys = [
    "You are HAPPY in Creator Assistant mode.",
    "Write in a single voice; no meta-commentary.",
    content.tone ? `Tone: ${content.tone}.` : "",
    content.audience ? `Audience: ${content.audience}.` : "",
    `Kind: ${kind}. Return clean markdown only.`,
  ]
    .filter(Boolean)
    .join(" ");
  const res = await callGateway("/chat/completions", {
    model,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: content.prompt },
    ],
  });
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = (json?.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new Error("Model returned no text.");
  return {
    mime_type: "text/markdown",
    data_url: `data:text/markdown;base64,${b64utf8(text)}`,
    size_bytes: new TextEncoder().encode(text).length,
    model,
    studio: kind,
    operation: "copy",
    extra: { text, tone: content.tone ?? null, audience: content.audience ?? null },
  };
}

/**
 * Step 2 — After Founder decision (approved), invoke generation via the
 * existing canonical Creator gateway path and store the result as a
 * versioned creator_assets row. Also appends to creator_generations
 * (existing canonical log) so Studio history reflects Founder-initiated
 * generations too.
 */
export const finalizeCreatorGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateFinalise)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: appr, error: readErr } = await supabase
      .from("approvals")
      .select("*")
      .eq("id", data.approval_id)
      .single();
    if (readErr || !appr) throw new Error("approval_not_found");
    if (appr.entity_type !== APPROVAL_ENTITY)
      throw new Error("approval_entity_mismatch");
    if (appr.status !== "approved") throw new Error("approval_not_approved");

    const meta = (appr.metadata ?? {}) as Record<string, unknown>;
    const kind = meta.kind as FounderCreatorKind | undefined;
    const name = meta.name as string | undefined;
    const content = (meta.content ?? {}) as FounderCreatorContent;
    if (!kind || !isKind(kind)) throw new Error("kind_missing");
    if (!name) throw new Error("name_missing");
    if (!content.prompt) throw new Error("prompt_missing");

    const generationId = appr.entity_id as string;
    const started = Date.now();

    // Next version for this generation lineage (per approval entity_id).
    const { data: prior } = await supabase
      .from("creator_assets")
      .select("id, metadata")
      .contains("metadata", { generation_id: generationId } as never);
    const priorRows = Array.isArray(prior) ? prior : [];
    const priorVersions = new Set<number>();
    for (const row of priorRows) {
      const m = (row.metadata ?? {}) as Record<string, unknown>;
      if (typeof m.asset_version === "number") priorVersions.add(m.asset_version);
    }
    const nextVersion = priorVersions.size + 1;

    let payload: GeneratedPayload;
    try {
      payload = await runGeneration(kind, content);
    } catch (e) {
      await writeCanonicalAudit(supabase, {
        category: "founder.creator",
        action: "finalize.failed",
        entity_type: APPROVAL_ENTITY,
        entity_id: generationId,
        company_id: (appr.company_id as string) ?? undefined,
        severity: "warning",
        metadata: { capability: CAPABILITY, kind, error: String(e).slice(0, 300) },
      });
      // Mirror into creator_generations as failure so Studio history stays truthful.
      await supabase.from("creator_generations").insert({
        user_id: userId,
        project_id: null,
        studio: kind,
        operation: "founder.finalize",
        model: content.model ?? null,
        prompt: content.prompt,
        input: { approval_id: appr.id, kind, name },
        output_asset_id: null,
        status: "failed",
        error: String(e).slice(0, 500),
        duration_ms: Date.now() - started,
      });
      throw e;
    }

    // Asset kind stored on creator_assets — align with existing Creator OS
    // taxonomy (image, audio, document). Marketing / social / brand map to
    // "document"; presentation and video stored as "document" of JSON.
    const assetKind =
      kind === "image" ? "image" : kind === "audio" ? "audio" : "document";

    const { data: assetRow, error: insErr } = await supabase
      .from("creator_assets")
      .insert({
        user_id: userId,
        project_id: null,
        name,
        kind: assetKind,
        mime_type: payload.mime_type,
        data_url: payload.data_url,
        size_bytes: payload.size_bytes,
        prompt: content.prompt,
        model: payload.model,
        tags: ["founder", "creator", kind, `v${nextVersion}`],
        metadata: {
          source: ASSET_SOURCE,
          generation_id: generationId,
          approval_id: appr.id,
          founder_kind: kind,
          asset_version: nextVersion,
          status: "final",
          finalized_at: new Date().toISOString(),
          company_id: appr.company_id,
          ...(payload.extra ?? {}),
        } as never,
      })
      .select("id, name, size_bytes, metadata")
      .single();
    if (insErr) throw new Error(`asset_insert_failed: ${insErr.message}`);

    // Append to existing canonical generations log.
    await supabase.from("creator_generations").insert({
      user_id: userId,
      project_id: null,
      studio: payload.studio,
      operation: payload.operation,
      model: payload.model,
      prompt: content.prompt,
      input: { approval_id: appr.id, kind, name, ...(payload.extra ?? {}) },
      output_asset_id: assetRow.id,
      status: "succeeded",
      duration_ms: Date.now() - started,
    });

    await writeCanonicalAudit(supabase, {
      category: "founder.creator",
      action: "finalize",
      entity_type: "creator_generation",
      entity_id: generationId,
      company_id: (appr.company_id as string) ?? undefined,
      after: {
        approval_id: appr.id,
        generation_id: generationId,
        asset_version: nextVersion,
        asset_id: assetRow.id,
        model: payload.model,
      },
      severity: "notice",
      metadata: { capability: CAPABILITY, kind, name },
    });

    return {
      generation_id: generationId,
      asset_id: assetRow.id as string,
      asset_version: nextVersion,
      kind,
      model: payload.model,
    };
  });

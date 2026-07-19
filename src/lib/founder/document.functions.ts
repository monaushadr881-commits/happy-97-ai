/**
 * R183 Batch C — Founder Final Document Generation (END-TO-END RUNTIME)
 *
 * SINGLE canonical server-function surface that wires the full Founder
 * runtime flow for ONE real capability: turning a Founder-approved
 * document request into a finalised, versioned workspace asset.
 *
 * Flow:
 *   Founder action
 *     → withBrain (capability: founder.document.finalize)
 *     → runBrain / impact analysis (format+size)
 *     → requestFounderApproval  (R158 — public.approvals)
 *     → Founder decides via decideFounderApproval
 *     → writeCanonicalAudit
 *     → Execute (INSERT into public.creator_assets — canonical asset store)
 *     → writeCanonicalAudit (finalise)
 *     → Founder Dashboard reads via creator_assets + audit_logs
 *
 * Canonical owners REUSED (no new runtime, no new tables):
 *   Brain guard    → src/lib/founder/with-brain.ts
 *   Approval       → src/lib/founder/approval.functions.ts → public.approvals
 *   Audit          → src/lib/founder/audit.ts             → public.write_audit
 *   Asset store    → public.creator_assets (Creator OS)
 *   Format catalog → src/lib/founder/document-types.ts
 *   Status catalog → src/lib/founder/document-status.ts
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "./audit";
import { withBrain } from "./with-brain";
import { adoptToCanonicalPipeline } from "./pipeline";
import {
  DOCUMENT_FORMAT_MIME,
  DOCUMENT_FORMAT_EXTENSION,
  isDocumentFormat,
  isDocumentCategory,
  type DocumentFormat,
  type DocumentCategory,
} from "./document-types";

const CAPABILITY = "founder.document.finalize" as const;
const APPROVAL_ENTITY = "founder_document" as const;

// ---- Request: create approval for a draft document ----

interface RequestDocInput {
  company_id: string;
  title: string;
  format: DocumentFormat;
  category: DocumentCategory;
  content_b64: string;
  reason?: string;
}

function validateRequestDoc(input: unknown): RequestDocInput {
  const v = input as Partial<RequestDocInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.company_id || typeof v.company_id !== "string")
    throw new Error("company_id_required");
  if (!v.title || typeof v.title !== "string")
    throw new Error("title_required");
  if (!isDocumentFormat(v.format)) throw new Error("format_invalid");
  if (!isDocumentCategory(v.category)) throw new Error("category_invalid");
  if (!v.content_b64 || typeof v.content_b64 !== "string")
    throw new Error("content_required");
  return {
    company_id: v.company_id,
    title: v.title,
    format: v.format,
    category: v.category,
    content_b64: v.content_b64,
    reason: typeof v.reason === "string" ? v.reason : undefined,
  };
}

/** Impact analysis — pure, deterministic, no I/O. Brain step. */
function analyseImpact(input: RequestDocInput) {
  const size_bytes = Math.floor((input.content_b64.length * 3) / 4);
  return {
    size_bytes,
    mime_type: DOCUMENT_FORMAT_MIME[input.format],
    extension: DOCUMENT_FORMAT_EXTENSION[input.format],
    risk: size_bytes > 5_000_000 ? "elevated" : "standard",
  };
}

/**
 * Step 1 — Founder submits a document draft. Runs Brain (impact
 * analysis) then creates an R158 approval row via public.approvals.
 * The draft payload is stored in approval.metadata for the finalise
 * step to consume once decideFounderApproval marks it 'approved'.
 */
export const requestFounderDocumentGeneration = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator(validateRequestDoc)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "founder", module: "document", capability: "request",
      user_id: userId, company_id: data.company_id,
      summary: `document ${data.title}`,
      metadata: { format: data.format, category: data.category },
    });

    // Brain step — wrapped so capability + approval shape is enforced.
    const brain = withBrain<RequestDocInput, ReturnType<typeof analyseImpact>>({
      capability: CAPABILITY,
      handler: (input) => analyseImpact(input),
    });
    const brainResult = await brain({
      capability: CAPABILITY,
      input: data,
      // Draft creation is Founder-initiated but does not require prior
      // approval — the approval it creates IS the gating primitive.
      context: { isFounder: true, approvalGranted: true },
    });

    const { data: row, error } = await supabase
      .from("approvals")
      .insert({
        company_id: data.company_id,
        entity_type: APPROVAL_ENTITY,
        entity_id: crypto.randomUUID(), // provisional draft id
        title: data.title,
        reason: data.reason ?? null,
        requested_by: userId,
        status: "pending",
        metadata: {
          capability: CAPABILITY,
          format: data.format,
          category: data.category,
          content_b64: data.content_b64,
          impact: brainResult.output,
          brain_duration_ms: brainResult.durationMs,
        } as never,
      })
      .select("id, status, entity_id")
      .single();
    if (error) throw new Error(`approval_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "founder.document",
      action: "request",
      entity_type: APPROVAL_ENTITY,
      entity_id: row.entity_id as string,
      company_id: data.company_id,
      after: { approval_id: row.id, impact: brainResult.output },
      severity: "notice",
      metadata: { capability: CAPABILITY, title: data.title },
    });

    return {
      approval_id: row.id as string,
      draft_id: row.entity_id as string,
      status: row.status as string,
      impact: brainResult.output,
    };
  });

// ---- Finalise: after Founder has approved, materialise the asset ----

interface FinaliseDocInput {
  approval_id: string;
}

function validateFinaliseDoc(input: unknown): FinaliseDocInput {
  const v = input as Partial<FinaliseDocInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.approval_id || typeof v.approval_id !== "string")
    throw new Error("approval_id_required");
  return { approval_id: v.approval_id };
}

/**
 * Step 2 — After Founder has decided the approval (approved via
 * decideFounderApproval), finalise: create a creator_assets row
 * (canonical workspace asset store), write audit, return asset id.
 * Enforces version-only semantics: never overwrites; each finalise
 * appends a new asset row with metadata.version incremented.
 */
export const finalizeFounderDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateFinaliseDoc)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "founder", module: "document", capability: "finalize",
      user_id: userId, company_id: "00000000-0000-0000-0000-000000000000",
      summary: `finalize approval ${data.approval_id}`,
    });

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
    const format = meta.format as DocumentFormat | undefined;
    const category = meta.category as DocumentCategory | undefined;
    const content_b64 = meta.content_b64 as string | undefined;
    if (!format || !isDocumentFormat(format))
      throw new Error("approval_format_invalid");
    if (!category || !isDocumentCategory(category))
      throw new Error("approval_category_invalid");
    if (!content_b64) throw new Error("approval_content_missing");

    // Determine next version for this draft.
    const draftId = appr.entity_id as string;
    const { data: prior } = await supabase
      .from("creator_assets")
      .select("id, metadata")
      .contains("metadata", { draft_id: draftId } as never);
    const nextVersion =
      Array.isArray(prior) && prior.length > 0 ? prior.length + 1 : 1;

    const mime = DOCUMENT_FORMAT_MIME[format];
    const ext = DOCUMENT_FORMAT_EXTENSION[format];
    const dataUrl = `data:${mime};base64,${content_b64}`;
    const size_bytes = Math.floor((content_b64.length * 3) / 4);

    const { data: asset, error: insErr } = await supabase
      .from("creator_assets")
      .insert({
        user_id: userId,
        name: `${appr.title}.${ext}`,
        kind: "document",
        mime_type: mime,
        data_url: dataUrl,
        size_bytes,
        tags: ["founder", "document", category, format],
        metadata: {
          source: "founder.document.finalize",
          draft_id: draftId,
          approval_id: appr.id,
          format,
          category,
          status: "final",
          version: nextVersion,
          finalized_at: new Date().toISOString(),
          company_id: appr.company_id,
        } as never,
      })
      .select("id, name, size_bytes, metadata")
      .single();
    if (insErr) throw new Error(`asset_insert_failed: ${insErr.message}`);

    await writeCanonicalAudit(supabase, {
      category: "founder.document",
      action: "finalize",
      entity_type: "creator_asset",
      entity_id: asset.id as string,
      company_id: (appr.company_id as string) ?? undefined,
      after: {
        asset_id: asset.id,
        approval_id: appr.id,
        version: nextVersion,
      },
      severity: "notice",
      metadata: {
        capability: CAPABILITY,
        format,
        category,
        size_bytes,
      },
    });

    return {
      asset_id: asset.id as string,
      version: nextVersion,
      name: asset.name as string,
      size_bytes,
    };
  });

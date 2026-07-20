/**
 * R272 — Canonical Builder Submission Entry
 *
 * SINGLE canonical server-function used by every /builder/* thin shell to
 * push a Founder prompt into the platform. Reuses existing canonical
 * owners only:
 *   • requireSupabaseAuth              — authenticated Supabase client
 *   • writeCanonicalAudit              — public.audit_logs via write_audit RPC
 *   • adoptToCanonicalPipeline (best effort, when the caller has a
 *     company membership) — public.brain_sessions + audit
 *
 * NO new table. NO new runtime. NO new AI provider. NO new approval
 * engine. Preserves R111 Architecture Lock.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

interface SubmitInput {
  surface: string;   // builder slug, e.g. "ngo", "website"
  preset: string;    // preset id inside that surface
  prompt: string;    // Founder prompt text
  attachments?: number; // count of attached items
}

function validate(input: unknown): SubmitInput {
  const v = (input ?? {}) as Partial<SubmitInput>;
  if (!v.surface || typeof v.surface !== "string") throw new Error("surface_required");
  if (!v.preset || typeof v.preset !== "string") throw new Error("preset_required");
  if (!v.prompt || typeof v.prompt !== "string") throw new Error("prompt_required");
  const prompt = v.prompt.trim().slice(0, 8000);
  if (!prompt) throw new Error("prompt_empty");
  return {
    surface: v.surface.slice(0, 64),
    preset: v.preset.slice(0, 64),
    prompt,
    attachments: typeof v.attachments === "number" ? v.attachments : 0,
  };
}

export interface BuilderSubmitResult {
  audit_id: string;
  session_id: string | null;
  company_id: string | null;
  status: "accepted";
}

export const submitBuilderPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<BuilderSubmitResult> => {
    const { supabase, userId } = context;

    // Resolve a company for pipeline adoption (best-effort — never blocks).
    let companyId: string | null = null;
    try {
      const { data: emp } = await supabase
        .from("employees")
        .select("company_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (emp?.company_id) companyId = emp.company_id as string;
    } catch {
      companyId = null;
    }
    if (!companyId) {
      try {
        const { data: owned } = await supabase
          .from("companies")
          .select("id")
          .eq("owner_id", userId)
          .limit(1)
          .maybeSingle();
        if (owned?.id) companyId = owned.id as string;
      } catch {
        // ignore
      }
    }

    // Open brain session via canonical pipeline when we have a company.
    let sessionId: string | null = null;
    if (companyId) {
      try {
        const res = await adoptToCanonicalPipeline(supabase, {
          domain: "creator",
          module: "builder",
          capability: "submit",
          user_id: userId,
          company_id: companyId,
          source: `builder.${data.surface}`,
          summary: `${data.surface}/${data.preset}: ${data.prompt.slice(0, 160)}`,
          metadata: {
            surface: data.surface,
            preset: data.preset,
            attachments: data.attachments ?? 0,
            prompt_len: data.prompt.length,
          },
        });
        sessionId = res.session_id;
      } catch {
        sessionId = null;
      }
    }

    // Canonical audit — always writes.
    const auditId = await writeCanonicalAudit(supabase, {
      category: "builder.prompt",
      action: "submit",
      entity_type: `builder.${data.surface}`,
      entity_id: undefined,
      company_id: companyId ?? undefined,
      severity: "info",
      metadata: {
        surface: data.surface,
        preset: data.preset,
        prompt: data.prompt,
        attachments: data.attachments ?? 0,
        session_id: sessionId,
      },
    });

    return {
      audit_id: auditId,
      session_id: sessionId,
      company_id: companyId,
      status: "accepted",
    };
  });

/** R64.5 — Publish (store submissions). Never fabricates external calls. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOpsAdminR64, writeAudit } from "./gate";
import { STORE_CODES } from "./contracts";
import { monitorAllStores, storeReadiness } from "./store-monitors";

export const listSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid().optional() }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    let q = sb.from("release_store_submissions").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.release_id) q = q.eq("release_id", data.release_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { submissions: rows ?? [] };
  });

export const submitToStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      release_id: z.string().uuid(),
      store: z.enum(STORE_CODES as [string, ...string[]]),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const readiness = storeReadiness(data.store as any);
    const sb: any = context.supabase;
    const { data: row, error } = await sb.from("release_store_submissions").insert({
      release_id: data.release_id,
      store: data.store,
      status: readiness.ready ? "queued" : "blocked",
      metadata: { readiness },
    }).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(context, { category: "release", action: "store_submit", entity_type: "release_store_submissions", entity_id: row.id, metadata: { store: data.store } });
    return {
      submission: row,
      status: readiness.ready ? "queued" : "blocked",
      blocked_reason: readiness.ready ? undefined : readiness.reason,
      required_secrets: readiness.missing_secrets ?? [],
      required_accounts: readiness.required_accounts ?? [],
    };
  });

export const storeStatusMatrix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdminR64(context);
    return { stores: monitorAllStores(), generated_at: new Date().toISOString() };
  });

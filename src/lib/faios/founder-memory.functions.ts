/** R66 FAIOS — founder memory (scoped key-value). */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFaiosAccess, writeFaiosAudit } from "./gate";

export const listMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ scope: z.string().optional() }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    let q = sb.from("faios_memory").select("*").eq("founder_id", context.userId).order("updated_at", { ascending: false }).limit(200);
    if (data.scope) q = q.eq("scope", data.scope);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { memory: rows ?? [] };
  });

export const upsertMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    scope: z.string().min(1).max(120),
    key: z.string().min(1).max(200),
    value: z.record(z.string(), z.any()),
    weight: z.number().int().min(1).max(10).optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { data: row, error } = await sb.from("faios_memory").upsert({
      founder_id: context.userId,
      scope: data.scope, key: data.key, value: data.value,
      weight: data.weight ?? 1, updated_at: new Date().toISOString(),
    }, { onConflict: "founder_id,scope,key" }).select().single();
    if (error) throw new Error(error.message);
    await writeFaiosAudit(context, { action: "memory_upsert", entity_type: "faios_memory", entity_id: row.id, metadata: { scope: data.scope, key: data.key } });
    return { memory: row };
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { error } = await sb.from("faios_memory").delete().eq("id", data.id).eq("founder_id", context.userId);
    if (error) throw new Error(error.message);
    await writeFaiosAudit(context, { action: "memory_delete", entity_type: "faios_memory", entity_id: data.id });
    return { ok: true };
  });

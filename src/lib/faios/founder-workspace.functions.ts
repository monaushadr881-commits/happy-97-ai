/** R66 FAIOS — workspace items (notes, tasks, pins). */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFaiosAccess, writeFaiosAudit } from "./gate";

export const listWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ kind: z.string().optional() }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    let q = sb.from("faios_workspace_items").select("*").eq("founder_id", context.userId).order("updated_at", { ascending: false }).limit(200);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const createWorkspaceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    kind: z.string().min(1).max(80),
    title: z.string().min(1).max(300),
    body: z.record(z.string(), z.any()).optional(),
    pinned: z.boolean().optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "createWorkspaceItem", source: "api", module: "faios.workspace.createWorkspaceItem" });
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { data: row, error } = await sb.from("faios_workspace_items").insert({
      founder_id: context.userId, kind: data.kind, title: data.title,
      body: data.body ?? {}, pinned: data.pinned ?? false,
    }).select().single();
    if (error) throw new Error(error.message);
    await writeFaiosAudit(context, { action: "workspace_create", entity_type: "faios_workspace_items", entity_id: row.id });
    return { item: row };
  });

export const updateWorkspaceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(300).optional(),
    body: z.record(z.string(), z.any()).optional(),
    status: z.string().max(40).optional(),
    pinned: z.boolean().optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "updateWorkspaceItem", source: "api", module: "faios.workspace.updateWorkspaceItem" });
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const patch: any = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.body !== undefined) patch.body = data.body;
    if (data.status !== undefined) patch.status = data.status;
    if (data.pinned !== undefined) patch.pinned = data.pinned;
    const { data: row, error } = await sb.from("faios_workspace_items")
      .update(patch).eq("id", data.id).eq("founder_id", context.userId).select().single();
    if (error) throw new Error(error.message);
    return { item: row };
  });

export const deleteWorkspaceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "deleteWorkspaceItem", source: "api", module: "faios.workspace.deleteWorkspaceItem" });
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { error } = await sb.from("faios_workspace_items").delete().eq("id", data.id).eq("founder_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

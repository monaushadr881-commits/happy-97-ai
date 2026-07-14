/**
 * HAPPY X — Workspace Service
 */
import { defineService, V, validate, z, type ServiceContext } from "../core";
import { workspacesRepo, membershipsRepo, auditRepo } from "@/enterprise/repositories.server";

const CreateInput = z.object({
  company_id: V.uuid,
  brand_id: V.uuid.optional(),
  slug: V.slug,
  name: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
});

export const workspaceService = defineService({ name: "workspace", version: "v1" }, () => ({
  async listByCompany(ctx: ServiceContext, companyId: string) {
    return workspacesRepo(ctx.supabase).listByCompany(validate(V.uuid, companyId));
  },
  async listMine(ctx: ServiceContext) {
    return workspacesRepo(ctx.supabase).myWorkspaces(ctx.userId);
  },
  async create(ctx: ServiceContext, input: unknown) {
    const data = validate(CreateInput, input);
    const ws = await workspacesRepo(ctx.supabase).create(data);
    await auditRepo(ctx.supabase).write({
      category: "admin", action: "workspace.created",
      entity_type: "workspace", entity_id: ws.id, company_id: ws.company_id, after: ws,
    });
    return ws;
  },
  async members(ctx: ServiceContext, workspaceId: string) {
    return membershipsRepo(ctx.supabase).listByWorkspace(validate(V.uuid, workspaceId));
  },
}));

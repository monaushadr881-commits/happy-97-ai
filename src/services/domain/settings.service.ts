/**
 * HAPPY X — Settings Service (hierarchical resolution)
 */
import { defineService, V, validate, z, type ServiceContext } from "../core";
import { settingsRepo, auditRepo } from "@/enterprise/repositories.server";
import type { ScopeType, Json } from "@/enterprise/types";

const ScopeSchema = z.enum(["platform", "company", "brand", "workspace", "department", "team"]);
const UpsertInput = z.object({
  scope_type: ScopeSchema,
  scope_id: V.uuid.nullable(),
  key: z.string().min(1).max(200),
  value: z.unknown(),
});

export const settingsService = defineService({ name: "settings", version: "v1" }, () => ({
  async list(ctx: ServiceContext, scope: ScopeType, scopeId: string | null) {
    return settingsRepo(ctx.supabase).list(scope, scopeId);
  },
  async upsert(ctx: ServiceContext, input: unknown) {
    const data = validate(UpsertInput, input);
    const s = await settingsRepo(ctx.supabase).upsert({
      scope_type: data.scope_type,
      scope_id: data.scope_id,
      key: data.key,
      value: (data.value ?? null) as Json,
    });
    await auditRepo(ctx.supabase).write({
      category: "admin", action: "setting.updated",
      entity_type: "setting", entity_id: s.id,
      metadata: { key: data.key, scope_type: data.scope_type, scope_id: data.scope_id },
    });
    return s;
  },
  async effective(ctx: ServiceContext, key: string, scope: {
    company_id?: string; brand_id?: string; workspace_id?: string; department_id?: string;
  }) {
    return settingsRepo(ctx.supabase).effective(key, { ...scope, user_id: ctx.userId });
  },
}));

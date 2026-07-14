/**
 * HAPPY X — Audit Service
 */
import { defineService, V, validate, z, type ServiceContext } from "../core";
import { auditRepo } from "@/enterprise/repositories.server";

const RecentInput = z.object({
  company_id: V.uuid.nullable().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const auditService = defineService({ name: "audit", version: "v1" }, () => ({
  async recent(ctx: ServiceContext, input: unknown = {}) {
    const p = validate(RecentInput, input);
    return auditRepo(ctx.supabase).recent(p.company_id ?? null, p.limit);
  },
  async write(ctx: ServiceContext, input: Parameters<ReturnType<typeof auditRepo>["write"]>[0]) {
    return auditRepo(ctx.supabase).write(input);
  },
}));

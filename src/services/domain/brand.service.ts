/**
 * HAPPY X — Brand Service
 */
import { defineService, V, validate, z, type ServiceContext } from "../core";
import { brandsRepo, auditRepo } from "@/enterprise/repositories.server";

const CreateInput = z.object({
  company_id: V.uuid,
  slug: V.slug,
  name: z.string().min(2).max(200),
  tagline: z.string().max(280).optional(),
  primary_color: z.string().max(16).optional(),
});

export const brandService = defineService({ name: "brand", version: "v1" }, () => ({
  async listByCompany(ctx: ServiceContext, companyId: string) {
    return brandsRepo(ctx.supabase).listByCompany(validate(V.uuid, companyId));
  },
  async create(ctx: ServiceContext, input: unknown) {
    const data = validate(CreateInput, input);
    const brand = await brandsRepo(ctx.supabase).create(data);
    await auditRepo(ctx.supabase).write({
      category: "admin", action: "brand.created",
      entity_type: "brand", entity_id: brand.id, company_id: brand.company_id, after: brand,
    });
    return brand;
  },
}));

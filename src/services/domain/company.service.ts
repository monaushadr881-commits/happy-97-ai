/**
 * HAPPY X — Company Service
 */
import { defineService, forbidden, notFound, V, validate, z, type ServiceContext } from "../core";
import { companiesRepo, auditRepo, authzRepo } from "@/enterprise/repositories.server";
import type { Company } from "@/enterprise/types";

const CreateInput = z.object({
  slug: V.slug,
  legal_name: z.string().min(2).max(200),
  display_name: z.string().min(2).max(200),
  tagline: z.string().max(280).optional(),
  country: z.string().max(80).optional(),
  timezone: z.string().max(80).optional(),
});

export const companyService = defineService({ name: "company", version: "v1" }, () => ({
  async list(ctx: ServiceContext): Promise<Company[]> {
    return companiesRepo(ctx.supabase).list();
  },
  async byId(ctx: ServiceContext, id: string): Promise<Company> {
    const c = await companiesRepo(ctx.supabase).byId(validate(V.uuid, id));
    if (!c) throw notFound("Company not found");
    return c;
  },
  async create(ctx: ServiceContext, input: unknown): Promise<Company> {
    const data = validate(CreateInput, input);
    const isFounder = await authzRepo(ctx.supabase).isPlatformFounder(ctx.userId);
    if (!isFounder) throw forbidden("Only the platform founder can create companies");
    const company = await companiesRepo(ctx.supabase).create({ ...data, owner_id: ctx.userId });
    await auditRepo(ctx.supabase).write({
      category: "admin", action: "company.created",
      entity_type: "company", entity_id: company.id, company_id: company.id,
      after: company, severity: "notice",
    });
    return company;
  },
}));

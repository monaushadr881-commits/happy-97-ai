/**
 * HAPPY X — Universal Search Service
 * Full-text over knowledge_articles today; vector search extension point.
 */
import { defineService, validate, z, type ServiceContext } from "../core";

const SearchInput = z.object({
  q: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(20),
});

export const searchService = defineService({ name: "search", version: "v1" }, () => ({
  async knowledge(ctx: ServiceContext, input: unknown) {
    const p = validate(SearchInput, input);
    const { data, error } = await ctx.supabase
      .from("knowledge_articles")
      .select("id, title, summary, slug")
      .textSearch("search_vector" as never, p.q, { type: "websearch" })
      .limit(p.limit);
    if (error) return { items: [] as unknown[], warning: error.message };
    return { items: data ?? [] };
  },
  async companies(ctx: ServiceContext, input: unknown) {
    const p = validate(SearchInput, input);
    const { data, error } = await ctx.supabase
      .from("companies").select("id, display_name, slug")
      .ilike("display_name", `%${p.q}%`).limit(p.limit);
    if (error) throw error;
    return { items: data ?? [] };
  },
}));

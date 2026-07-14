/** /enterprise/ai — Company AI: usage, conversations, memory. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, StatCard, Chip, Hairline } from "@/design-system/primitives";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { apiListConversations } from "@/lib/api-v1.functions";
import { opsAiUsage } from "@/lib/ops-v1.functions";
import { Sparkles, MessageSquare, Coins, Gauge } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise/ai")({
  head: () => ({ meta: [{ title: "AI — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: AI,
});

function AI() {
  const { companyId, companies } = useEnterprise();
  const usage = useQuery({ queryKey: ["ent", "ai-usage", companyId], enabled: !!companyId, queryFn: () => opsAiUsage({ data: { hours: 24, company_id: companyId! } }) });
  const convos = useQuery({ queryKey: ["ent", "convos", companyId], enabled: !!companyId, queryFn: () => apiListConversations() });

  if (!companyId) return (<><PageHeader eyebrow="AI" title="AI Management" /><NoCompanySelected hasAny={companies.length > 0} /></>);

  const u = (usage.data ?? {}) as { requests?: number; tokens?: number; cost_usd?: number };

  return (
    <>
      <PageHeader eyebrow="AI" title="Company AI" description="Prompts, memory, knowledge and cost — one AI plane per company." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Requests · 24h" value={(u.requests ?? 0).toLocaleString()} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Tokens · 24h" value={(u.tokens ?? 0).toLocaleString()} icon={<Gauge className="h-4 w-4" />} />
        <StatCard label="Cost · 24h" value={`$${(u.cost_usd ?? 0).toFixed(2)}`} icon={<Coins className="h-4 w-4" />} />
        <StatCard label="Conversations" value={((convos.data as unknown[] | undefined)?.length ?? 0).toLocaleString()} icon={<MessageSquare className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Conversations</h2>
          <Chip tone="gold">{(convos.data as unknown[] | undefined)?.length ?? 0}</Chip>
        </div>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {((convos.data ?? []) as Array<{ id: string; title?: string | null; updated_at?: string }>).slice(0, 10).map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <span className="truncate text-paper">{c.title ?? "Untitled"}</span>
              <time className="numeric text-[11px] text-soft-gray">{c.updated_at ? new Date(c.updated_at).toLocaleString() : ""}</time>
            </li>
          ))}
          {!((convos.data as unknown[] | undefined)?.length) && <li className="py-2 text-xs text-soft-gray">No conversations.</li>}
        </ul>
      </Panel>
    </>
  );
}

/**
 * /founder/ai — AI Management.
 * Usage, costs, sessions and conversation surface. Live via opsAiUsage + apiListConversations.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, StatCard, Chip, Hairline, EmptyState } from "@/design-system/primitives";
import { opsAiUsage } from "@/lib/ops-v1.functions";
import { apiListConversations } from "@/lib/api-v1.functions";
import { Sparkles, Coins, Gauge, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/ai")({
  head: () => ({ meta: [{ title: "AI — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderAI,
});

function FounderAI() {
  const usage = useQuery({
    queryKey: ["founder", "ai-usage"],
    queryFn: () => opsAiUsage({ data: { hours: 24 } }),
    refetchInterval: 60_000,
  });
  const conversations = useQuery({ queryKey: ["founder", "convos"], queryFn: () => apiListConversations() });

  const u = (usage.data ?? {}) as { requests?: number; tokens?: number; cost_usd?: number; by_model?: Array<{ model: string; requests: number; tokens: number }> };

  return (
    <>
      <PageHeader
        eyebrow="Intelligence"
        title="AI Management"
        description="Providers, models, prompts, sessions, memory, moderation and spend — one command surface."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Requests · 24h" value={(u.requests ?? 0).toLocaleString()} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Tokens · 24h" value={(u.tokens ?? 0).toLocaleString()} icon={<Gauge className="h-4 w-4" />} />
        <StatCard label="Cost · 24h" value={`$${(u.cost_usd ?? 0).toFixed(2)}`} icon={<Coins className="h-4 w-4" />} />
        <StatCard label="Conversations" value={(conversations.data as unknown[] | undefined)?.length?.toLocaleString() ?? "0"} icon={<MessageSquare className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Model Mix</h2>
          <Hairline className="my-4" />
          <ul className="space-y-2">
            {(u.by_model ?? []).map((m) => {
              const total = u.tokens || 1;
              const pct = Math.min(100, Math.round((m.tokens / total) * 100));
              return (
                <li key={m.model} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-paper">{m.model}</span>
                    <span className="numeric text-soft-gray">{m.tokens.toLocaleString()} tok</span>
                  </div>
                  <div className="h-1 rounded bg-white/5">
                    <div className="h-1 rounded bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
            {!(u.by_model?.length) && <li className="text-xs text-soft-gray">No model usage recorded in the last 24h.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Conversations</h2>
            <Chip tone="gold">{(conversations.data as unknown[] | undefined)?.length ?? 0}</Chip>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {((conversations.data ?? []) as Array<{ id: string; title?: string | null; updated_at?: string }>).slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate text-paper">{c.title ?? "Untitled"}</span>
                <time className="numeric text-[11px] text-soft-gray">
                  {c.updated_at ? new Date(c.updated_at).toLocaleString() : ""}
                </time>
              </li>
            ))}
            {!(conversations.data as unknown[] | undefined)?.length && (
              <li className="py-6">
                <EmptyState title="No conversations" description="Start one from the Founder AI assistant." />
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </>
  );
}

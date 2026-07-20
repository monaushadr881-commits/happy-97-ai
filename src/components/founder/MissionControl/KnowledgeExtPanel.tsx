import { memo } from "react";
import { Panel, Hairline, StatCard } from "@/design-system/primitives";
import { Workflow } from "lucide-react";
import { fmt, ago, type MCData } from "./utils";

type Slice = MCData["knowledge_ext"] | undefined;

export const KnowledgeExtPanel = memo(function KnowledgeExtPanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Knowledge · Articles &amp; References
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatCard label="Articles" value={fmt(data?.articles_total)} />
        <StatCard label="Public" value={fmt(data?.articles_public)} />
        <StatCard label="Drafts" value={fmt(data?.articles_drafts)} />
        <StatCard label="References" value={fmt(data?.references_total)} />
        <StatCard label="Publish pending" value={fmt(data?.pending_publish_approvals)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Recent Updates
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.recent_updates ?? []).slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{r.title}</div>
                  <div className="text-[11px] text-soft-gray">
                    {r.is_public ? "public" : "company"} · v{r.version}
                  </div>
                </div>
                <span className="text-[11px] text-soft-gray">{ago(r.updated_at)}</span>
              </li>
            ))}
            {!data?.recent_updates.length && (
              <li className="py-2 text-xs text-soft-gray">No articles yet.</li>
            )}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Recent References
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.recent_references ?? []).slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{r.label}</div>
                  <div className="truncate text-[11px] text-soft-gray">
                    {r.url ?? "—"} · article {r.article_id.slice(0, 8)}
                  </div>
                </div>
                <span className="text-[11px] text-soft-gray">{ago(r.created_at)}</span>
              </li>
            ))}
            {!data?.recent_references.length && (
              <li className="py-2 text-xs text-soft-gray">No references yet.</li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
});

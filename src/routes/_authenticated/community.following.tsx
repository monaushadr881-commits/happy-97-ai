/** /community/following */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState } from "@/design-system/primitives";
import { communityFeed } from "@/lib/cmos-v1.functions";

export const Route = createFileRoute("/_authenticated/community/following")({
  head: () => ({ meta: [{ title: "Following — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const feed = useQuery({ queryKey: ["cmos", "feed", "following"], queryFn: () => communityFeed({ data: { scope: "following" } }) });
    return (
      <>
        <PageHeader eyebrow="Community" title="Following" description="Posts from people you follow." />
        <div className="space-y-3">
          {feed.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Loading…</Panel>
            : (feed.data?.items ?? []).length === 0
              ? <Panel className="p-8"><EmptyState title="Nothing here yet" description="Follow creators to build your feed." /></Panel>
              : feed.data!.items.map((p: any) => (
                <Panel key={p.id} className="p-5">
                  <div className="text-sm text-paper whitespace-pre-wrap">{p.body}</div>
                  <div className="text-[10px] uppercase tracking-widest text-soft-gray mt-3">{new Date(p.created_at).toLocaleString()}</div>
                </Panel>
              ))}
        </div>
      </>
    );
  },
});

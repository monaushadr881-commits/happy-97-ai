/** /community/mine */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { communityFeed, communityDeletePost } from "@/lib/cmos-v1.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community/mine")({
  head: () => ({ meta: [{ title: "My posts — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const qc = useQueryClient();
    const feed = useQuery({ queryKey: ["cmos", "feed", "mine"], queryFn: () => communityFeed({ data: { scope: "mine" } }) });
    const del = useMutation({
      mutationFn: (id: string) => communityDeletePost({ data: { id } }),
      onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["cmos", "feed"] }); },
    });
    return (
      <>
        <PageHeader eyebrow="Community" title="My Posts" description="You own every post. Delete anytime." />
        <div className="space-y-3">
          {feed.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Loading…</Panel>
            : (feed.data?.items ?? []).length === 0
              ? <Panel className="p-8"><EmptyState title="You haven't posted yet" description="Head to the feed to share something." /></Panel>
              : feed.data!.items.map((p: any) => (
                <Panel key={p.id} className="p-5">
                  <div className="text-sm text-paper whitespace-pre-wrap">{p.body}</div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-[10px] uppercase tracking-widest text-soft-gray">{new Date(p.created_at).toLocaleString()}</div>
                    <Button variant="ghost" size="sm" onClick={() => del.mutate(p.id)}>Delete</Button>
                  </div>
                </Panel>
              ))}
        </div>
      </>
    );
  },
});

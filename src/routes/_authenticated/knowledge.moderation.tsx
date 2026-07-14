/** /knowledge/moderation — draft/publish workflow. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState, Chip } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { kbSearchArticles, kbPublish } from "@/lib/knowledge-v1.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/knowledge/moderation")({
  head: () => ({ meta: [{ title: "Moderation — Knowledge OS" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const qc = useQueryClient();
    const drafts = useQuery({
      queryKey: ["kb", "moderation"],
      queryFn: () => kbSearchArticles({ data: { scope: "all", limit: 50 } }),
    });
    const publish = useMutation({
      mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
        kbPublish({ data: { id, is_public: isPublic } }),
      onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["kb"] }); },
      onError: (e: any) => toast.error(e?.message ?? "Failed"),
    });
    return (
      <>
        <PageHeader eyebrow="Governance" title="Moderation & Publishing"
          description="Company admins approve, version and publish knowledge. Company knowledge stays isolated until explicitly made public." />
        {drafts.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Loading…</Panel>
          : (drafts.data ?? []).length === 0
            ? <Panel className="p-8"><EmptyState title="Nothing to review" description="Newly authored articles will appear here." /></Panel>
            : <Panel className="p-5">
                <div className="divide-y divide-white/5">
                  {drafts.data!.map((a: any) => (
                    <div key={a.id} className="py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-paper truncate">{a.title}</div>
                        <div className="text-[11px] text-soft-gray flex items-center gap-2">
                          {a.is_public ? <Chip tone="success">Public</Chip> : <Chip>Company</Chip>}
                          <span>{a.language}</span>
                          <span>updated {new Date(a.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {a.is_public
                        ? <Button size="sm" variant="ghost" onClick={() => publish.mutate({ id: a.id, isPublic: false })}>Unpublish</Button>
                        : <Button size="sm" variant="outline" onClick={() => publish.mutate({ id: a.id, isPublic: true })}>Publish public</Button>}
                    </div>
                  ))}
                </div>
              </Panel>}
      </>
    );
  },
});

/** /community/groups */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState } from "@/design-system/primitives";
import { communityListGroups } from "@/lib/cmos-v1.functions";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/community/groups")({
  head: () => ({ meta: [{ title: "Groups — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const q = useQuery({ queryKey: ["cmos", "groups"], queryFn: () => communityListGroups() });
    return (
      <>
        <PageHeader eyebrow="Community" title="Groups"
          description="Public, private, business, education, founder, local, interest — verified spaces to gather and grow." />
        {q.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Loading…</Panel>
          : (q.data ?? []).length === 0
            ? <Panel className="p-8"><EmptyState title="No groups yet" description="Groups you can join will appear here." /></Panel>
            : <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {q.data!.map((g: any) => (
                  <Panel key={g.id} className="p-5">
                    <Users className="h-5 w-5 text-gold mb-3" />
                    <div className="text-sm font-serif text-paper">{g.name}</div>
                    <div className="text-[11px] text-soft-gray mt-1">{g.description ?? g.visibility}</div>
                  </Panel>
                ))}
              </div>}
      </>
    );
  },
});

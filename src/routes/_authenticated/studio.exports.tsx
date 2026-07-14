/** /studio/exports — Export history. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { creatorRecentGenerations } from "@/lib/creator-v1.functions";

export const Route = createFileRoute("/_authenticated/studio/exports")({
  head: () => ({ meta: [{ title: "Exports — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: ExportsPage,
});

function ExportsPage() {
  const q = useQuery({
    queryKey: ["creator", "recent", "all"],
    queryFn: () => creatorRecentGenerations({ data: { limit: 100 } }),
  });
  return (
    <>
      <PageHeader eyebrow="Exports" title="Generation history"
        description="Every AI generation is recorded here for audit, download and re-use." />
      <Panel className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.2em] text-soft-gray">
            <tr>
              <th className="p-3">Studio</th>
              <th className="p-3">Operation</th>
              <th className="p-3">Model</th>
              <th className="p-3">Status</th>
              <th className="p-3">Prompt</th>
              <th className="p-3">When</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((g) => (
              <tr key={g.id} className="border-t border-white/5">
                <td className="p-3"><Chip tone="gold">{g.studio}</Chip></td>
                <td className="p-3 text-soft-gray text-xs uppercase tracking-[0.15em]">{g.operation}</td>
                <td className="p-3 text-soft-gray text-xs">{g.model}</td>
                <td className="p-3"><Chip tone={g.status === "succeeded" ? "success" : "neutral"}>{g.status}</Chip></td>
                <td className="p-3 text-xs text-paper max-w-[24rem] truncate">{g.prompt}</td>
                <td className="p-3 text-[10px] text-soft-gray">{new Date(g.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(q.data ?? []).length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-xs text-soft-gray">No generations yet.</td></tr>
            )}
          </tbody>
        </table>
        <Hairline />
      </Panel>
    </>
  );
}

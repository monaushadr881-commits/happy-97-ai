import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReleasePageShell } from "./-shell";
import { Panel, EmptyState, Chip } from "@/design-system/primitives";
import { listReleases } from "@/lib/release-r64/release-history-r64.functions";

export const Route = createFileRoute("/_authenticated/releases/history")({
  component: () => {
    const fn = useServerFn(listReleases);
    const { data, isLoading } = useQuery({ queryKey: ["r64", "history"], queryFn: () => fn({ data: {} }) });
    return (
      <ReleasePageShell title="Release History" description="Version-controlled release records with lifecycle and channel.">
        <Panel className="p-6">
          {isLoading && <div className="text-sm text-soft-gray">Loading…</div>}
          {!isLoading && (data?.releases.length ?? 0) === 0 && <EmptyState title="No releases" />}
          {(data?.releases.length ?? 0) > 0 && (
            <table className="w-full text-xs">
              <thead className="text-left text-soft-gray"><tr><th className="py-1">Version</th><th>Channel</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {data!.releases.map((r: any) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="py-1 text-paper font-mono">{r.version}</td>
                    <td className="text-soft-gray">{r.channel}</td>
                    <td><Chip tone={r.status === "published" ? "success" : r.status === "failed" ? "danger" : "warning"}>{r.status}</Chip></td>
                    <td className="text-soft-gray">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </ReleasePageShell>
    );
  },
});

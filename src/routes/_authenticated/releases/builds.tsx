import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReleasePageShell } from "./-shell";
import { Panel, Chip, EmptyState } from "@/design-system/primitives";
import { listBuilds } from "@/lib/release-r64/build-pipeline-r64.functions";

export const Route = createFileRoute("/_authenticated/releases/builds")({
  component: () => {
    const fn = useServerFn(listBuilds);
    const { data, isLoading } = useQuery({ queryKey: ["r64", "builds"], queryFn: () => fn({ data: {} }), refetchInterval: 15_000 });
    return (
      <ReleasePageShell title="Build Pipeline" description="Native builds require external toolchains (Android SDK, Xcode, signtool, notarytool, snapcraft). Unavailable builds are recorded as BLOCKED with the exact missing dependency.">
        <Panel className="p-6">
          {isLoading && <div className="text-sm text-soft-gray">Loading…</div>}
          {!isLoading && (data?.builds.length ?? 0) === 0 && <EmptyState title="No builds queued" />}
          {(data?.builds.length ?? 0) > 0 && (
            <table className="w-full text-xs">
              <thead className="text-left text-soft-gray"><tr><th className="py-1">Platform</th><th>Kind</th><th>Status</th><th>Priority</th><th>Queued</th><th>Duration</th><th>Reason</th></tr></thead>
              <tbody>
                {data!.builds.map((b: any) => (
                  <tr key={b.id} className="border-t border-white/5">
                    <td className="py-1 text-paper">{b.platform_code}</td>
                    <td>{b.build_kind}</td>
                    <td><Chip tone={b.status === "succeeded" ? "success" : b.status === "failed" ? "danger" : "warning"}>{b.status}</Chip></td>
                    <td className="text-soft-gray">{b.priority}</td>
                    <td className="text-soft-gray">{new Date(b.queued_at).toLocaleString()}</td>
                    <td className="text-soft-gray">{b.duration_ms ? `${Math.round(b.duration_ms / 1000)}s` : "—"}</td>
                    <td className="text-soft-gray text-[10px]">{b.blocked_reason ?? "—"}</td>
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

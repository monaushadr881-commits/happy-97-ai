import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReleasePageShell } from "./-shell";
import { Panel, EmptyState, Chip } from "@/design-system/primitives";
import { listRollouts } from "@/lib/release-r64/rollout-r64.functions";

export const Route = createFileRoute("/_authenticated/releases/rollout")({
  component: () => {
    const fn = useServerFn(listRollouts);
    const { data, isLoading } = useQuery({ queryKey: ["r64", "rollouts"], queryFn: () => fn({ data: {} }), refetchInterval: 30_000 });
    return (
      <ReleasePageShell title="Staged Rollouts" description="1% → 5% → 10% → 20% → 50% → 100% with pause, resume, cancel, rollback, and emergency rollback.">
        <Panel className="p-6">
          {isLoading && <div className="text-sm text-soft-gray">Loading…</div>}
          {!isLoading && (data?.rollouts.length ?? 0) === 0 && <EmptyState title="No rollouts" />}
          {(data?.rollouts.length ?? 0) > 0 && (
            <table className="w-full text-xs">
              <thead className="text-left text-soft-gray"><tr><th className="py-1">Store</th><th>State</th><th>Current</th><th>Target</th><th>Updated</th></tr></thead>
              <tbody>
                {data!.rollouts.map((r: any) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="py-1 text-paper">{r.store}</td>
                    <td><Chip tone={r.state === "completed" ? "success" : r.state === "rolled_back" ? "danger" : "warning"}>{r.state}</Chip></td>
                    <td className="text-soft-gray">{r.current_percent}%</td>
                    <td className="text-soft-gray">{r.target_percent}%</td>
                    <td className="text-soft-gray">{new Date(r.updated_at).toLocaleString()}</td>
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

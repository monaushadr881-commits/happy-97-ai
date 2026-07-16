import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReleasePageShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { storeStatusMatrix, listSubmissions } from "@/lib/release-r64/publish-r64.functions";

export const Route = createFileRoute("/_authenticated/releases/publish")({
  component: () => {
    const statusFn = useServerFn(storeStatusMatrix);
    const subsFn = useServerFn(listSubmissions);
    const status = useQuery({ queryKey: ["r64", "store-status"], queryFn: () => statusFn(), refetchInterval: 60_000 });
    const subs = useQuery({ queryKey: ["r64", "submissions"], queryFn: () => subsFn({ data: {} }) });
    return (
      <ReleasePageShell title="Publishing" description="Store submission validation and status. Real store submission requires external credentials — blocked stores return required secrets honestly.">
        <div className="space-y-6">
          <Panel className="p-6">
            <h3 className="text-sm font-semibold mb-3">Store Readiness</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {(status.data?.stores ?? []).map((s: any) => (
                <div key={s.store} className="border border-white/5 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-paper text-sm">{s.store}</span>
                    <Chip tone={s.status === "ok" ? "success" : "warning"}>{s.status}</Chip>
                  </div>
                  {s.blocked_reason && <div className="text-xs text-soft-gray mt-1">{s.blocked_reason}</div>}
                  {s.required_secrets?.length ? (
                    <div className="text-xs text-soft-gray mt-1">Required: {s.required_secrets.join(", ")}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-6">
            <h3 className="text-sm font-semibold mb-3">Recent Submissions</h3>
            {(subs.data?.submissions.length ?? 0) === 0 ? (
              <div className="text-sm text-soft-gray">No submissions.</div>
            ) : (
              <ul className="text-xs space-y-1">
                {subs.data!.submissions.map((s: any) => (
                  <li key={s.id} className="flex justify-between border-t border-white/5 py-1">
                    <span className="text-paper">{s.store}</span>
                    <Chip tone={s.status === "published" ? "success" : s.status === "blocked" ? "warning" : "neutral"}>{s.status}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </ReleasePageShell>
    );
  },
});

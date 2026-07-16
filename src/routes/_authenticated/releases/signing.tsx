import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReleasePageShell } from "./-shell";
import { Panel, EmptyState, Chip } from "@/design-system/primitives";
import { listSigningProfiles } from "@/lib/release-r64/signing-r64.functions";

export const Route = createFileRoute("/_authenticated/releases/signing")({
  component: () => {
    const fn = useServerFn(listSigningProfiles);
    const { data, isLoading } = useQuery({ queryKey: ["r64", "signing"], queryFn: () => fn() });
    return (
      <ReleasePageShell title="Signing Profiles" description="Signing profile metadata only. Private key material is never stored, read, or transmitted by this runtime.">
        <Panel className="p-6">
          {isLoading && <div className="text-sm text-soft-gray">Loading…</div>}
          {!isLoading && (data?.profiles.length ?? 0) === 0 && <EmptyState title="No signing profiles" description="Add one via signing-r64 API." />}
          {(data?.profiles.length ?? 0) > 0 && (
            <table className="w-full text-xs">
              <thead className="text-left text-soft-gray"><tr><th className="py-1">Platform</th><th>Label</th><th>Fingerprint</th><th>Expires</th></tr></thead>
              <tbody>
                {data!.profiles.map((p: any) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="py-1 text-paper">{p.platform}</td>
                    <td className="text-soft-gray">{p.label}</td>
                    <td className="text-soft-gray font-mono">{p.cert_fingerprint?.slice(0, 16) ?? "—"}</td>
                    <td className="text-soft-gray">{p.cert_expires_at ? <Chip tone={new Date(p.cert_expires_at) < new Date() ? "danger" : "success"}>{new Date(p.cert_expires_at).toLocaleDateString()}</Chip> : "—"}</td>
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

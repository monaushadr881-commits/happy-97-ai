import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReleasePageShell } from "./-shell";
import { Panel, EmptyState, Chip } from "@/design-system/primitives";
import { listArtifacts } from "@/lib/release-r64/release-artifacts-r64.functions";

export const Route = createFileRoute("/_authenticated/releases/artifacts")({
  component: () => {
    const fn = useServerFn(listArtifacts);
    const { data, isLoading } = useQuery({ queryKey: ["r64", "artifacts"], queryFn: () => fn({ data: {} }) });
    return (
      <ReleasePageShell title="Artifacts" description="APK, AAB, IPA, MSIX, DMG, PKG, AppImage, Snap, Flatpak, Docker, source, symbols. Metadata-only registry (no storage bucket yet).">
        <Panel className="p-6">
          {isLoading && <div className="text-sm text-soft-gray">Loading…</div>}
          {!isLoading && (data?.artifacts.length ?? 0) === 0 && (
            <EmptyState title="No artifacts registered" description="Register artifact metadata (kind, sha256, storage URL) via API." />
          )}
          {(data?.artifacts.length ?? 0) > 0 && (
            <table className="w-full text-xs">
              <thead className="text-left text-soft-gray"><tr><th className="py-1">Kind</th><th>Filename</th><th>SHA256</th><th>Size</th><th>Status</th></tr></thead>
              <tbody>
                {data!.artifacts.map((a: any) => (
                  <tr key={a.id} className="border-t border-white/5">
                    <td className="py-1 text-paper">{a.kind}</td>
                    <td className="text-soft-gray truncate max-w-xs">{a.filename}</td>
                    <td className="text-soft-gray font-mono">{a.sha256?.slice(0, 12) ?? "—"}…</td>
                    <td className="text-soft-gray">{a.size_bytes ?? "—"}</td>
                    <td><Chip tone={a.validation_status === "valid" ? "success" : a.validation_status === "invalid" ? "danger" : "warning"}>{a.validation_status}</Chip></td>
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

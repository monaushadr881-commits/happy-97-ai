/** /plugins/installed — Installed plugin inventory (reserved). */
import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/plugins/installed")({
  head: () => ({ meta: [{ title: "Installed Plugins — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: InstalledPlugins,
});

function InstalledPlugins() {
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-white/5 bg-charcoal p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
          <Package className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-display text-xl">No plugins installed</h3>
        <p className="mt-2 text-sm text-soft-gray max-w-md mx-auto">
          Installed plugins will appear here. The workspace is provisioned but the plugin runtime is
          reserved for a future release.
        </p>
      </div>

      <div className="rounded-xl border border-white/5 bg-charcoal/60 p-4">
        <p className="eyebrow mb-2">Lifecycle</p>
        <ul className="text-xs text-soft-gray space-y-1.5">
          <li>• Install via <code>apiInstallPlugin</code></li>
          <li>• Check for updates with <code>apiCheckPluginUpdates</code></li>
          <li>• Uninstall via <code>apiUninstallPlugin</code></li>
          <li>• Manage permissions via <code>apiGrantPluginPermissions</code> / <code>apiRevokePluginPermissions</code></li>
        </ul>
      </div>
    </div>
  );
}

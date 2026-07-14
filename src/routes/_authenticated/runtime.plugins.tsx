import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/plugins")({
  head: () => ({ meta: [{ title: "Plugin Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Plugin Runtime"
      description="Plugin registry, loader, runtime, permissions, security, analytics, updates and marketplace."
      bullets={["Registry", "Loader", "Runtime", "Permissions", "Security", "Analytics", "Updates", "Marketplace"]}
      apiHints={["pluginsRuntimeService", "apiPluginsStatus"]}
    />
  ),
});

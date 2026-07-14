import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/plugins/manage")({
  head: () => ({ meta: [{ title: "Plugin Manage — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Plugin Management"
      description="Enable, disable, configure and audit every plugin across the workspace."
      bullets={["Enable / disable", "Permission audit", "Security report", "Billing status", "Version pin", "Bulk actions"]}
      apiHints={["apiPluginMarketManage", "apiPluginSecurityReport", "apiPluginBilling"]}
    />
  ),
});

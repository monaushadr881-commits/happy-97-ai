import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/dashboard")({
  head: () => ({ meta: [{ title: "Runtime Dashboard — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Runtime Dashboard"
      description="Unified runtime KPIs, health and executive signals across all capability runtimes."
      bullets={["Runtime KPIs", "Capability health", "Memory health", "Decision health", "Execution health", "Workflow health", "Tool health", "Plugin health", "Developer health"]}
      apiHints={["dashboardRuntimeService", "apiDashboardStatus"]}
    />
  ),
});

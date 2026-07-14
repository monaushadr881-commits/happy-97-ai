import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/monitor")({
  head: () => ({ meta: [{ title: "Runtime Monitor — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Runtime Monitor"
      description="Live observability across capability, memory, decision, execution, tool and workflow runtimes."
      bullets={["Live capability graph", "Memory pressure", "Decision latency", "Execution queue", "Tool queue", "Workflow queue", "Alerts"]}
      apiHints={["monitorRuntimeService", "apiMonitorStatus"]}
    />
  ),
});

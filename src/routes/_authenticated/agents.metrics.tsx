import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/agents/metrics")({
  head: () => ({ meta: [{ title: "Agent Metrics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Agent Metrics"
      description="Utilization, latency, success rate and failure signals per capability."
      bullets={["Utilization", "Latency", "Success rate", "Failure signals", "Concurrency", "SLA compliance"]}
      apiHints={["apiArMetrics"]}
    />
  ),
});

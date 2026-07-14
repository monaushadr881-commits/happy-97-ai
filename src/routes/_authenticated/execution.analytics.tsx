import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/execution/analytics")({
  head: () => ({ meta: [{ title: "Execution Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Execution Analytics"
      description="Success rate, latency, retry frequency and approval throughput."
      bullets={["Success rate", "Latency", "Retry frequency", "Approval throughput", "Rollback rate", "SLA compliance"]}
      apiHints={["apiExecAnalytics"]}
    />
  ),
});

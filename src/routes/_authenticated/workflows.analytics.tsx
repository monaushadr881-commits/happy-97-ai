import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/workflows/analytics")({
  head: () => ({ meta: [{ title: "Workflow Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Workflow Analytics"
      description="Throughput, success rate, bottlenecks and approval latency across workflows."
      bullets={["Success rate", "Retry rate", "Bottlenecks", "Approval latency", "Cost per run", "Time saved"]}
      apiHints={["apiWorkflowAnalytics"]}
    />
  ),
});

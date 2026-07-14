import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/workflows/executions")({
  head: () => ({ meta: [{ title: "Workflow Executions — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Workflow Executions"
      description="Historical executions with outcome, latency and audit trail."
      bullets={["Executions log", "Outcome", "Latency", "Approval trail", "Failure log", "Analytics"]}
      apiHints={["apiWrExecutions", "apiWrAnalytics"]}
    />
  ),
});

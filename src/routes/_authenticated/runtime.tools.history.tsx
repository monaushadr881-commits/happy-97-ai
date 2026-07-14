import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/tools/history")({
  head: () => ({ meta: [{ title: "Tool Runtime History — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Tool Execution History"
      description="Historic tool executions with outcomes, latency, and recovery events."
      bullets={["Historic runs", "Outcomes", "Latency", "Recovery events", "Audit trail"]}
      apiHints={["apiToolExecHistory", "apiToolExecMetrics", "apiToolExecRecover"]}
    />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/executions")({
  head: () => ({ meta: [{ title: "Runtime Executions — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Executions"
      description="History of capability executions with inputs, outputs, validation results, and audit trail."
      bullets={["Execution log", "Input / output diff", "Validation status", "Latency breakdown", "Audit trail", "Replay"]}
      apiHints={["apiRtExecutions", "apiRtExecute"]}
    />
  ),
});

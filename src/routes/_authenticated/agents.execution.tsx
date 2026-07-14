import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/agents/execution")({
  head: () => ({ meta: [{ title: "Agent Execution — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Agent Execution"
      description="Live queue for capability dispatches with dependencies, retries, cancels and progress."
      bullets={["Execution queue", "Dependencies", "Progress", "Retry", "Cancel", "Audit trail"]}
      apiHints={["apiArQueue", "apiArDispatch", "apiArExecute", "apiArCancel"]}
    />
  ),
});

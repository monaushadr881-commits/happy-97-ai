import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/execution/history")({
  head: () => ({ meta: [{ title: "Execution History — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Execution History"
      description="Completed goals and tasks with outcome, duration and audit trail."
      bullets={["Goal outcomes", "Task duration", "Approval trail", "Failure log", "Rollback record", "Audit link"]}
      apiHints={["apiExecHistory"]}
    />
  ),
});

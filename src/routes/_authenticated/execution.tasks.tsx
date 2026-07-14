import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/execution/tasks")({
  head: () => ({ meta: [{ title: "Execution Tasks — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Execution Tasks"
      description="Live queue with dependency graph, approvals, retries and rollbacks."
      bullets={["Task queue", "Dependency graph", "Approvals", "Retry", "Rollback", "Cancel"]}
      apiHints={["apiExecTasks", "apiExecDependencyGraph", "apiExecApprove", "apiExecRetry", "apiExecRollback", "apiExecCancel"]}
    />
  ),
});

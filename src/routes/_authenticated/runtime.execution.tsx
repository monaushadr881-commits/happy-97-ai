import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/execution")({
  head: () => ({ meta: [{ title: "Execution Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Execution Runtime"
      description="Queue, scheduler, monitor, timeline, retry, rollback, approval, dependency and task runtime with execution analytics."
      bullets={["Queue", "Scheduler", "Monitor", "Timeline", "Retry", "Rollback", "Approval", "Dependency", "Task", "Analytics"]}
      apiHints={["executionRuntimeService", "apiExecutionStatus"]}
    />
  ),
});

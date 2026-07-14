import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/workflows/designer")({
  head: () => ({ meta: [{ title: "Workflow Designer — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Workflow Designer"
      description="Design workflows from a goal: HAPPY suggests steps, dependencies, approvals and schedules."
      bullets={["Goal → task graph", "Dependency editor", "Approval gates", "Schedule builder", "Retry policy", "Version & publish"]}
      apiHints={["apiWorkflowCreate", "apiWorkflowUpdate", "apiWorkflowDependencyGraph", "apiWorkflowSchedule"]}
    />
  ),
});

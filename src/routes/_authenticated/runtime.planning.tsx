import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/planning")({
  head: () => ({ meta: [{ title: "Runtime Planning — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Planning Runtime"
      description="Live planner: goal analysis, task decomposition, dependency resolution, risk and execution planning."
      bullets={["Live planner", "Goal analyzer", "Task planner", "Dependency resolver", "Risk planner", "Execution planner", "Milestone planner", "Timeline planner", "Planning analytics"]}
      apiHints={["apiPlanStatus", "apiPlanCreate", "apiPlanAnalyzeGoal", "apiPlanResolveDeps", "apiPlanAssessRisk", "apiPlanMilestones", "apiPlanTimeline", "apiPlanAnalytics"]}
    />
  ),
});

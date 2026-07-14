import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/planner")({
  head: () => ({ meta: [{ title: "Runtime Planner — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Multi-Capability Planner"
      description="Live planner runtime: goals, dependencies, risk, priority, scenarios, milestones, timeline and analytics."
      bullets={["Goal planner", "Dependency planner", "Execution planner", "Risk planner", "Priority planner", "Scenario planner", "Milestone planner", "Timeline planner", "Analytics"]}
      apiHints={["apiPlannerPlan", "apiPlannerDependencies", "apiPlannerRisk", "apiPlannerScenarios", "apiPlannerMilestones", "apiPlannerAnalytics"]}
    />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/goals")({
  head: () => ({ meta: [{ title: "Runtime Goals — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Goals"
      description="Active and reserved goals, decomposition status, owning capability and milestone progress."
      bullets={["Active goals", "Decomposition", "Owning capability", "Milestones", "Progress", "Blockers"]}
      apiHints={["apiPlanGoals", "apiPlanAnalyzeGoal"]}
    />
  ),
});

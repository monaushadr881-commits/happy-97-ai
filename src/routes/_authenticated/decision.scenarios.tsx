import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/decision/scenarios")({
  head: () => ({ meta: [{ title: "Decision Scenarios — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Scenario Planner"
      description="Build side-by-side options, compare outcomes, and stress-test with what-if variables."
      bullets={["Multi-option compare", "What-if variables", "Weighted scoring", "Risk overlay", "Forecast overlay", "Save & share"]}
      apiHints={["apiDecisionScenario", "apiDecisionCompare", "apiDecisionOptimize"]}
    />
  ),
});

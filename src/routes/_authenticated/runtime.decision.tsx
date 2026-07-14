import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/decision")({
  head: () => ({ meta: [{ title: "Decision Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Decision Runtime"
      description="Decision, recommendation, forecast, confidence, opportunity, optimization engines with executive/business/education/research/creator advisors."
      bullets={["Decision Engine", "Recommendation Engine", "Forecast Engine", "Confidence Engine", "Opportunity Engine", "Optimization Engine", "Business Advisor", "Education Advisor", "Research Advisor", "Creator Advisor", "Executive Advisor", "Decision Analytics"]}
      apiHints={["decisionRuntimeService", "apiDecisionStatus"]}
    />
  ),
});

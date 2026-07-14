import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/runtime")({
  head: () => ({ meta: [{ title: "Intelligence Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Enterprise Intelligence Runtime"
      description="Live decision, recommendation, forecast, risk and opportunity runtime bound to Memory, Planning, Workflow, Business OS, Knowledge OS, Education OS and Automation."
      bullets={["Decision coordinator", "Recommendation engine", "Forecast runtime", "Risk analyzer", "Opportunity engine", "Business optimizer", "Trend detector", "Priority engine", "Analytics runtime"]}
      apiHints={["apiIrStatus", "apiIrDecide", "apiIrRecommend", "apiIrForecast", "apiIrAnalyzeRisk", "apiIrOpportunities", "apiIrOptimize", "apiIrTrends", "apiIrPriority", "apiIrAnalytics"]}
    />
  ),
});

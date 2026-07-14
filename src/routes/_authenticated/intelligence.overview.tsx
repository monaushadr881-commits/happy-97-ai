import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/overview")({
  head: () => ({ meta: [{ title: "Intelligence Overview — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Unified Intelligence Overview"
      description="Cross-module summary: agent activity, memory usage, decision insights, workflow & plugin health, developer metrics, enterprise KPIs."
      bullets={["Agent activity", "Memory usage", "Decision insights", "Workflow health", "Plugin health", "Developer metrics", "Enterprise KPIs", "Forecast summary", "Recommendation feed"]}
      apiHints={["apiDashOverview", "apiDashExecutive", "apiDashAgentActivity", "apiDashMemoryUsage", "apiDashDecisionInsights", "apiDashWorkflowHealth", "apiDashPluginHealth", "apiDashDeveloperMetrics", "apiDashEnterpriseKpis", "apiDashForecastSummary", "apiDashRecommendationFeed"]}
    />
  ),
});

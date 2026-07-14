import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/forecast")({
  head: () => ({ meta: [{ title: "Forecast — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Predictive Forecast"
      description="30/90/365-day projections with confidence bands and drivers."
      bullets={["Revenue forecast", "Cash projection", "Demand forecast", "Confidence bands", "Driver decomposition", "Scenario overlay"]}
      apiHints={["apiIntelForecast", "apiIntelTrends"]}
    />
  ),
});

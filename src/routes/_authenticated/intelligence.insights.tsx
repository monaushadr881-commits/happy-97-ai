import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/insights")({
  head: () => ({ meta: [{ title: "AI Insights — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="AI Insights"
      description="Continuous insight stream across enterprise signals."
      bullets={["Trend detection", "Anomaly alerts", "Growth opportunities", "Risk signals", "Cost signals", "Customer signals"]}
      apiHints={["apiEiInsights"]}
    />
  ),
});

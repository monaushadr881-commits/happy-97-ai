import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/intelligence/forecast")({
  head: () => ({ meta: [{ title: "Executive Forecast — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Executive Forecast"
      description="Multi-horizon forecast runtime for revenue, operations, learning and market signals."
      bullets={["30 / 90 / 365 day", "Scenario", "Confidence", "Drivers", "Comparisons"]}
      apiHints={["apiExecForecast", "apiExecAnalytics"]}
    />
  ),
});

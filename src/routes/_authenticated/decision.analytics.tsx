import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/decision/analytics")({
  head: () => ({ meta: [{ title: "Decision Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Decision Analytics"
      description="How well past decisions performed against forecast, risk and confidence."
      bullets={["Forecast vs actual", "Confidence calibration", "Risk realisation", "Time-to-decide", "Reversal rate", "Advisor performance"]}
      apiHints={["apiDecisionAnalytics"]}
    />
  ),
});

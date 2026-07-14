import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/intelligence/opportunities")({
  head: () => ({ meta: [{ title: "Executive Opportunities — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Opportunities"
      description="Live opportunity ranking derived from capability activity and forecast signals."
      bullets={["Growth opportunities", "Optimisation opportunities", "Score", "Owning capability"]}
      apiHints={["apiExecEngineOpportunities", "apiExecEngineForecast"]}
    />
  ),
});

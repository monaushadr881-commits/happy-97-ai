import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/dashboard")({
  head: () => ({ meta: [{ title: "Executive Dashboard — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Executive Dashboard"
      description="Real-time view of company health across finance, growth, risk and people."
      bullets={["Revenue vs plan", "Runway & burn", "Growth signals", "Risk register", "People metrics", "AI narrative"]}
      apiHints={["apiIntelExecutive", "apiIntelInsights"]}
    />
  ),
});

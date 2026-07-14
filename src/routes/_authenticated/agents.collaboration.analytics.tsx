import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/agents/collaboration/analytics")({
  head: () => ({ meta: [{ title: "Collaboration Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Collaboration Analytics"
      description="Consensus rate, capability utilization, conflict frequency and composition quality."
      bullets={["Consensus rate", "Capability utilization", "Conflict frequency", "Composition quality", "Latency SLO", "User satisfaction"]}
      apiHints={["apiCollabAnalytics"]}
    />
  ),
});

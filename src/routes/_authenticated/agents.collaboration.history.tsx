import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/agents/collaboration/history")({
  head: () => ({ meta: [{ title: "Collaboration History — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Collaboration History"
      description="Past collaboration sessions with capability trees, negotiations and merged responses."
      bullets={["Session log", "Capability trace", "Negotiation record", "Merged response", "Latency breakdown", "Audit link"]}
      apiHints={["apiCollabHistory"]}
    />
  ),
});

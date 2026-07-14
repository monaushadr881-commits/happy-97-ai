/** /transport — Transport Platform · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Bus } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/transport")({
  head: () => ({ meta: [{ title: "Transport Platform — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Transport Platform · v8.0"
      title="Transport Platform"
      description="Bus, rail, metro, taxi, logistics, traffic signals, route planning and fleet monitoring."
      icon={Bus}
      features={["Bus","Rail","Metro","Taxi","Logistics","Traffic Signals","Route Planning","Fleet Monitoring"]}
    />
  ),
});

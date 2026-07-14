/** /fleet — Autonomous Fleet · v11.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/fleet")({
  head: () => ({ meta: [{ title: "Autonomous Fleet — HAPPY v11.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Autonomous Fleet · v11.0"
      title="Autonomous Fleet"
      description="Vehicle dashboard, fleet monitoring, navigation, charging, maintenance, trips, telemetry and safety."
      icon={Truck}
      features={["Vehicle Dashboard","Fleet","Navigation","Charging","Maintenance","Trips","Telemetry","Safety"]}
    />
  ),
});

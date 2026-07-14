/** /iot-runtime — IoT Runtime · v11.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/iot-runtime")({
  head: () => ({ meta: [{ title: "IoT Runtime — HAPPY v11.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="IoT Runtime · v11.0"
      title="IoT Runtime"
      description="Managed IoT runtime tying edge nodes, devices and telemetry into one plane."
      icon={Radio}
      features={["Runtime","Edge Nodes","Devices","Telemetry"]}
    />
  ),
});

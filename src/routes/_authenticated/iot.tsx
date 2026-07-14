/** /iot — v4.0 IoT Platform surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/iot")({
  head: () => ({ meta: [{ title: "IoT Platform — HAPPY v4.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global AI Platform · v4.0"
      title="IoT Platform"
      description="Device registry, sensors, gateway, alerts, telemetry, realtime streaming, automation and analytics — one Digital Human across the fleet."
      icon={Radio}
      features={[
        "IoT Dashboard",
        "Device Registry",
        "Sensors",
        "Gateway",
        "Alerts",
        "Telemetry",
        "Realtime Stream",
        "Automation",
        "Analytics",
      ]}
    />
  ),
});

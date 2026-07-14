/** /devices — IoT Device Platform · v11.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { HardDrive } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/devices")({
  head: () => ({ meta: [{ title: "IoT Device Platform — HAPPY v11.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="IoT Device Platform · v11.0"
      title="IoT Device Platform"
      description="Device registry, provisioning, monitoring, health, firmware, OTA updates, groups and policies."
      icon={HardDrive}
      features={["Registry","Provisioning","Monitoring","Health","Firmware","OTA","Groups","Policies"]}
    />
  ),
});

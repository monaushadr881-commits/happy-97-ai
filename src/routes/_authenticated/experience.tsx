/** /experience — Global Experience Platform · v13.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/experience")({
  head: () => ({ meta: [{ title: "Global Experience Platform — HAPPY v13.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Experience Platform · v13.0"
      title="Global Experience Platform"
      description="Web, Android, iOS, Desktop, Tablet, Wearables, Smart Displays and Future Devices."
      icon={Smartphone}
      features={["Web","Android","iOS","Desktop","Tablet","Wearables","Smart Displays","Future"]}
    />
  ),
});

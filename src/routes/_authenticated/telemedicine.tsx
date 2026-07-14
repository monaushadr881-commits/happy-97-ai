/** /telemedicine — Telemedicine · v9.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Video } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/telemedicine")({
  head: () => ({ meta: [{ title: "Telemedicine — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Telemedicine · v9.0"
      title="Telemedicine"
      description="Video, voice and chat consultations, remote monitoring, digital prescriptions and patient messaging."
      icon={Video}
      features={["Video","Voice","Chat","Remote Monitoring","Digital Prescriptions","Messaging"]}
    />
  ),
});

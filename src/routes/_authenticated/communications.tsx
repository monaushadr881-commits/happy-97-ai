/** /communications — v6.0 Enterprise Communication surface. */
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/communications")({
  head: () => ({ meta: [{ title: "Enterprise Communications — HAPPY v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Autonomous Enterprise · v6.0"
      title="Enterprise Communications"
      description="A unified command centre for Email, WhatsApp, SMS, Push, Voice broadcast, Video messages, Announcements and Internal communication."
      icon={MessageSquare}
      features={[
        "Email Center",
        "WhatsApp Center",
        "SMS Center",
        "Push Notifications",
        "Voice Broadcast",
        "Video Messages",
        "Announcement Center",
        "Internal Communication",
      ]}
    />
  ),
});

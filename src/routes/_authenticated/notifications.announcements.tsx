/** /notifications/announcements — Announcements · Notification Platform · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications/announcements")({
  head: () => ({ meta: [{ title: "Announcements — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Announcements"
      description="Global, company, department, role, team, event & emergency announcements."
      icon={Megaphone}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

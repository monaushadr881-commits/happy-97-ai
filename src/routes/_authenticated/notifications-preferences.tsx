/** /notifications/preferences — Preferences · Notification Platform · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications-preferences")({
  head: () => ({ meta: [{ title: "Preferences — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Preferences"
      description="Per-user channel, schedule, DND, timezone & language."
      icon={SlidersHorizontal}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

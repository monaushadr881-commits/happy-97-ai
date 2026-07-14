/** /notifications/reminders — Reminder Engine · Notification Platform · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { AlarmClock } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications-reminders")({
  head: () => ({ meta: [{ title: "Reminder Engine — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Reminder Engine"
      description="Meeting, task, payment, invoice, subscription & medicine reminders."
      icon={AlarmClock}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

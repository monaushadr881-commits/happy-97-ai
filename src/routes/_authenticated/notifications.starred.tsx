/** /notifications/starred — Starred · Notification Platform · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications/starred")({
  head: () => ({ meta: [{ title: "Starred — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Starred"
      description="Starred and pinned notifications."
      icon={Star}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

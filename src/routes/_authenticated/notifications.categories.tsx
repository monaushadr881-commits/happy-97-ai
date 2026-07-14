/** /notifications/categories — Categories · Notification Platform · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/notifications/categories")({
  head: () => ({ meta: [{ title: "Categories — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Notification Platform · v1.0"
      title="Categories"
      description="System, security, business, community, education, AI, emergency."
      icon={Tag}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

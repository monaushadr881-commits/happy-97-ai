/** /websites — Websites · Domains & Hosting. */
import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/websites")({
  head: () => ({ meta: [{ title: "Websites — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Domains & Hosting"
      title="Websites"
      description="Landing pages, business, portfolio, ecommerce, education, hospital, NGO, restaurant, AI generated."
      icon={Layout}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

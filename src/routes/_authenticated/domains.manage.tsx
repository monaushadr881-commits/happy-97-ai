/** /domains/manage — Manage Domains · Domains & Hosting. */
import { createFileRoute } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/domains/manage")({
  head: () => ({ meta: [{ title: "Manage Domains — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Domains & Hosting"
      title="Manage Domains"
      description="DNS, SSL, email, nameservers & subdomains."
      icon={Settings2}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

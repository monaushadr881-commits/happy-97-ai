/** /domains — Domains. */
import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/domains")({
  head: () => ({ meta: [{ title: "Domains — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Domains & Hosting"
      title="Domains"
      description="Search, register, transfer, renew. DNS, SSL, email, subdomains, nameservers."
      icon={Globe}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

/** /domains/search — Domain Search · Domains & Hosting. */
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/domains/search")({
  head: () => ({ meta: [{ title: "Domain Search — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Domains & Hosting"
      title="Domain Search"
      description="Live domain availability across TLDs."
      icon={Search}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

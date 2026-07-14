/** /partners — v6.0 Partner Portal surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Handshake } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/partners")({
  head: () => ({ meta: [{ title: "Partner Portal — HAPPY v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Ecosystem · v6.0"
      title="Partner Portal"
      description="Onboard, enable and grow every strategic partner — deal registration, co-selling, revenue share and unified analytics."
      icon={Handshake}
      features={["Onboarding","Deal Registration","Co-Selling","Enablement","Revenue Share","Analytics","Contracts","Support"]}
    />
  ),
});

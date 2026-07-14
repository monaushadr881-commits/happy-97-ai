/** /ecosystem-intelligence — Ecosystem Intelligence · v14.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/ecosystem-intelligence")({
  head: () => ({ meta: [{ title: "Ecosystem Intelligence — HAPPY v14.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ecosystem Intelligence · v14.0"
      title="Ecosystem Intelligence"
      description="Organization, partner, network, growth, innovation and relationship intelligence."
      icon={Sparkles}
      features={["Organization","Partner","Network","Growth","Innovation","Relationship"]}
    />
  ),
});

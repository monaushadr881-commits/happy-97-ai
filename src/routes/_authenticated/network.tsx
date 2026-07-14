/** /network — Planetary Network · v14.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/network")({
  head: () => ({ meta: [{ title: "Planetary Network — HAPPY v14.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Planetary Network · v14.0"
      title="Planetary Network"
      description="Organization, company, partner, knowledge, collaboration and service networks with connection analytics."
      icon={Globe}
      features={["Organization","Company","Partner","Knowledge","Collaboration","Service","Analytics"]}
    />
  ),
});

/** /themes — Themes · Universal Builder · v1.0. */
import { createFileRoute } from "@tanstack/react-router";
import { Paintbrush } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({ meta: [{ title: "Themes — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Universal Builder · v1.0"
      title="Themes"
      description="Brand-ready themes across every builder surface."
      icon={Paintbrush}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});

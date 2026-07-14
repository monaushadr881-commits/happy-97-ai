/** /connectors — Universal Connector Platform · v14.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/connectors")({
  head: () => ({ meta: [{ title: "Universal Connector Platform — HAPPY v14.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Universal Connector Platform · v14.0"
      title="Universal Connector Platform"
      description="Connector hub, templates, sync engine, import/export, transformation engine and analytics."
      icon={Plug}
      features={["Hub","Templates","Sync","Import","Export","Transformation","Analytics"]}
    />
  ),
});

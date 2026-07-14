/** /identity — Digital Identity Platform · v14.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { IdCard } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/identity")({
  head: () => ({ meta: [{ title: "Digital Identity Platform — HAPPY v14.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Digital Identity Platform · v14.0"
      title="Digital Identity Platform"
      description="Identity hub for organizations, employees, partners, devices and applications with analytics."
      icon={IdCard}
      features={["Identity Hub","Org","Employee","Partner","Device","Application","Analytics"]}
    />
  ),
});

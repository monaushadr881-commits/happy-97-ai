/** /manufacturing — v7.0 Manufacturing Intelligence surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Factory } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/manufacturing")({
  head: () => ({ meta: [{ title: "Manufacturing Intelligence — HAPPY v7.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Manufacturing Platform · v7.0"
      title="Manufacturing Intelligence"
      description="Factory dashboard, machine monitoring, production analytics, BOM, production orders, quality control, maintenance, energy, waste and capacity planning."
      icon={Factory}
      features={["Factory Dashboard","Machine Monitoring","Production Analytics","BOM","Production Orders","Quality Control","Maintenance","Energy Analytics","Waste Analytics","Capacity Planning"]}
    />
  ),
});

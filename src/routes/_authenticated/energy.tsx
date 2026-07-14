/** /energy — Energy Management · v10.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/energy")({
  head: () => ({ meta: [{ title: "Energy Management — HAPPY v10.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Energy Management · v10.0"
      title="Energy Management"
      description="Energy dashboard, power/water/gas monitoring, carbon tracking, sustainability analytics and utility optimization."
      icon={Zap}
      features={["Energy Dashboard","Power","Water","Gas","Carbon","Sustainability","Optimization"]}
    />
  ),
});

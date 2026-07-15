/** /settings-appearance — Dynamic Theme Engine v2.0 · Appearance controls. */
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/settings-appearance")({
  head: () => ({ meta: [{ title: "Appearance — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Dynamic Theme Engine · v2.0"
      title="Appearance"
      description="Fine-tune radius, density, glass, animation, sidebar and background style. Every change applies instantly via CSS tokens — no reload."
      icon={Sparkles}
      features={["Accent","Radius","Density","Animation level","Glass level","Background style","Sidebar style","Font size"]}
    />
  ),
});

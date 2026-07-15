/** /settings-accessibility — Dynamic Theme Engine v2.0 · Accessibility. */
import { createFileRoute } from "@tanstack/react-router";
import { Accessibility } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/settings-accessibility")({
  head: () => ({ meta: [{ title: "Accessibility — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Dynamic Theme Engine · v2.0"
      title="Accessibility"
      description="WCAG AAA controls: reduced motion, high contrast, large text, color-blind safe palettes, keyboard navigation, screen-reader tuning."
      icon={Accessibility}
      features={["Reduced motion","High contrast","Large text","Color-blind safe","Keyboard nav","Screen readers","Focus rings","WCAG AAA"]}
    />
  ),
});

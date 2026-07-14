/** /vision — Computer Vision · v11.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/vision")({
  head: () => ({ meta: [{ title: "Computer Vision — HAPPY v11.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Computer Vision · v11.0"
      title="Computer Vision"
      description="Image processing, object detection, OCR, barcode/QR, industrial vision, quality inspection."
      icon={Eye}
      features={["Image Processing","Detection","OCR","Barcode","QR","Industrial","Quality"]}
    />
  ),
});

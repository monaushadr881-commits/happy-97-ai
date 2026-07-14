/** /documents — Universal Document Engine · v13.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Universal Document Engine — HAPPY v13.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Universal Document Engine · v13.0"
      title="Universal Document Engine"
      description="PDF, Word, Excel, PowerPoint, OCR, diagram reader, document search, knowledge and analytics."
      icon={FileText}
      features={["PDF","Word","Excel","PowerPoint","OCR","Diagram","Search","Knowledge","Analytics"]}
    />
  ),
});

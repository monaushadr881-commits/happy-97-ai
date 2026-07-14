/** /warehouse — Warehouse Automation · v10.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Warehouse } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/warehouse")({
  head: () => ({ meta: [{ title: "Warehouse Automation — HAPPY v10.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Warehouse Automation · v10.0"
      title="Warehouse Automation"
      description="Warehouse dashboard, receiving, putaway, picking, packing, shipping, barcode/QR and inventory automation."
      icon={Warehouse}
      features={["Dashboard","Receiving","Putaway","Picking","Packing","Shipping","Barcode","QR","Inventory Automation"]}
    />
  ),
});

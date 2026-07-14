import { createFileRoute } from "@tanstack/react-router";
import { PersonaDashboard } from "@/components/happyx/PersonaDashboard";
import { Truck, Warehouse, Network, BarChart3, Wallet, Users, LifeBuoy, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/distributor")({
  head: () => ({ meta: [{ title: "Distributor Dashboard — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PersonaDashboard
      persona="Distributor"
      subtitle="Multi-region distribution, dealers, warehouses, and settlement."
      tiles={[
        { icon: Truck, label: "Shipments", desc: "In-transit & dispatch" },
        { icon: Warehouse, label: "Warehouses", desc: "Locations & capacity" },
        { icon: Network, label: "Dealer Network", desc: "Onboard · Manage" },
        { icon: Package, label: "Inventory", desc: "Regional stock" },
        { icon: BarChart3, label: "Analytics", desc: "Region performance" },
        { icon: Wallet, label: "Settlement", desc: "Payouts & credit" },
        { icon: Users, label: "Team", desc: "Reps & field staff" },
        { icon: LifeBuoy, label: "Support", desc: "Escalations" },
      ]}
    />
  ),
});

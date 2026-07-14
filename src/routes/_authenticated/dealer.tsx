import { createFileRoute } from "@tanstack/react-router";
import { PersonaDashboard } from "@/components/happyx/PersonaDashboard";
import { Package, Boxes, Wallet, Users, Megaphone, BarChart3, CreditCard, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dealer")({
  head: () => ({ meta: [{ title: "Dealer Dashboard — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PersonaDashboard
      persona="Dealer"
      subtitle="Orders, inventory, commission, and channel performance."
      tiles={[
        { icon: Package, label: "Orders", desc: "Channel + retail" },
        { icon: Boxes, label: "Inventory", desc: "Live stock & SKUs" },
        { icon: Wallet, label: "Commission", desc: "Statements & payouts" },
        { icon: Users, label: "Customers", desc: "B2B accounts" },
        { icon: LifeBuoy, label: "Support", desc: "Tickets" },
        { icon: Megaphone, label: "Marketing", desc: "Campaigns & assets" },
        { icon: BarChart3, label: "Analytics", desc: "Sell-through" },
        { icon: CreditCard, label: "Payments", desc: "Ledger & KYC" },
      ]}
    />
  ),
});

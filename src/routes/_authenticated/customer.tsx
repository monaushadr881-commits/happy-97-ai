import { createFileRoute } from "@tanstack/react-router";
import { PersonaDashboard } from "@/components/happyx/PersonaDashboard";
import { ShoppingBag, Receipt, Star, Gift, LifeBuoy, Heart, Download, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/customer")({
  head: () => ({ meta: [{ title: "Customer Dashboard — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PersonaDashboard
      persona="Customer"
      subtitle="Your orders, subscriptions, rewards, and support — one place."
      tiles={[
        { icon: ShoppingBag, label: "Orders", desc: "Track and reorder" },
        { icon: Receipt, label: "Invoices", desc: "Download & pay" },
        { icon: Star, label: "Subscriptions", desc: "Plans & renewals" },
        { icon: Download, label: "Downloads", desc: "Licenses & files" },
        { icon: LifeBuoy, label: "Support", desc: "Tickets & chat" },
        { icon: Heart, label: "Wishlist", desc: "Saved items" },
        { icon: Gift, label: "Rewards & Referrals", desc: "Points & credits" },
        { icon: Settings, label: "Settings", desc: "Profile · Address · Payment" },
      ]}
    />
  ),
});

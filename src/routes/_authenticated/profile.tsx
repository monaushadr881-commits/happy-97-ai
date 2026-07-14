import { createFileRoute } from "@tanstack/react-router";
import { User, Mail, Shield, Building2, Sparkle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const cards = [
    { icon: User, label: "Identity", value: "Managed by Supabase Auth" },
    { icon: Mail, label: "Email", value: "Verified sign-in address" },
    { icon: Shield, label: "Roles", value: "Loaded from user_roles + role_assignments" },
    { icon: Building2, label: "Workspaces", value: "Company · Brand · Department scoped" },
    { icon: Sparkle, label: "Preferences", value: "Personal settings + AI configuration" },
  ];
  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-soft-gray">Your HAPPY Identity — synced across every workspace.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gold/20 bg-obsidian/60 p-5 backdrop-blur">
            <c.icon className="h-5 w-5 text-gold" />
            <div className="mt-3 text-[11px] uppercase tracking-widest text-soft-gray">{c.label}</div>
            <div className="mt-1 text-sm text-paper">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Smartphone, Fingerprint, KeyRound, Activity, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({ meta: [{ title: "Security — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: SecurityPage,
});

const controls = [
  { icon: KeyRound, label: "Password", status: "Strong · rotate every 90 days" },
  { icon: Smartphone, label: "Two-Factor Auth", status: "TOTP / SMS ready" },
  { icon: Fingerprint, label: "Trusted Devices", status: "Managed via sessions-v2" },
  { icon: Activity, label: "Login History", status: "IP + device audit trail" },
  { icon: Bell, label: "Security Alerts", status: "Realtime notifications enabled" },
  { icon: ShieldCheck, label: "Session Rotation", status: "JWT rotation on refresh" },
];

function SecurityPage() {
  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight">Security</h1>
      <p className="mt-2 text-sm text-soft-gray">Enterprise identity controls — powered by Supabase Auth + RLS.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {controls.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gold/20 bg-obsidian/60 p-5 backdrop-blur">
            <c.icon className="h-5 w-5 text-gold" />
            <div className="mt-3 text-sm font-semibold text-paper">{c.label}</div>
            <div className="mt-1 text-xs text-soft-gray">{c.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

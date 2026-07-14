/** /intelligence — Phase 2.8 Enterprise Intelligence layout (v2.0). */
import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, LayoutDashboard, LineChart, FileBarChart, Settings as SettingsIcon } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/intelligence", label: "Overview", icon: BrainCircuit, exact: true },
  { to: "/intelligence/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/intelligence/forecast", label: "Forecast", icon: LineChart },
  { to: "/intelligence/reports", label: "Reports", icon: FileBarChart },
  { to: "/intelligence/settings", label: "Settings", icon: SettingsIcon },
];

export const Route = createFileRoute("/_authenticated/intelligence")({
  head: () => ({ meta: [{ title: "Intelligence — HAPPY v2.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.0 · Phase 2.8"
      title="Enterprise Intelligence"
      description="Executive dashboards, predictive analytics, forecasting, trend detection, risk alerts, growth opportunities, executive reports and AI insights."
      icon={BrainCircuit}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Dashboards", value: "Executive", hint: "KPI, risk, growth" },
          { label: "Forecast horizons", value: "30/90/365", hint: "Reserved" },
          { label: "Insight streams", value: "6", hint: "Trends, risks, opportunities" },
          { label: "Report cadence", value: "Weekly", hint: "Configurable" },
        ],
        note: "All surfaces are wired against intelligence-v2 contracts. The v3.0 Intelligence roadmap remains reserved separately for advanced advisory features.",
      }}
    />
  ),
});

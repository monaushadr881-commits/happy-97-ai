/** /runtime/intelligence — Phase 3.4 Executive Intelligence Runtime layout. */
import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, Sparkles, LineChart, Lightbulb } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/runtime/intelligence", label: "Overview", icon: BrainCircuit, exact: true },
  { to: "/runtime/intelligence/advisor", label: "Advisor", icon: Sparkles },
  { to: "/runtime/intelligence/forecast", label: "Forecast", icon: LineChart },
  { to: "/runtime/intelligence/recommendations", label: "Recommendations", icon: Lightbulb },
];

export const Route = createFileRoute("/_authenticated/runtime/intelligence")({
  head: () => ({ meta: [{ title: "Executive Runtime — HAPPY v2.1" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.1 · Phase 3.4"
      title="Executive Intelligence Runtime"
      description="Executive advisor, forecast, recommendation, opportunity, risk and decision runtime — bound to the autonomous capability runtime."
      icon={BrainCircuit}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Advisor", value: "Executive", hint: "Reserved" },
          { label: "Forecast", value: "Multi-horizon", hint: "Reserved" },
          { label: "Recommendations", value: "Live", hint: "Reserved" },
          { label: "Decisions", value: "Auditable", hint: "RBAC + audit" },
        ],
        note: "Advisor, forecast, recommendation and decision surfaces reuse RBAC, audit and feature flags. Runtime activates with executive-runtime-v3.",
      }}
    />
  ),
});

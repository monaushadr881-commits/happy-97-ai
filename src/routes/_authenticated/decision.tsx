/** /decision — Phase 2.7 Decision Intelligence layout. */
import { createFileRoute } from "@tanstack/react-router";
import { Scale, GitBranch, BarChart3, History } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/decision", label: "Overview", icon: Scale, exact: true },
  { to: "/decision/scenarios", label: "Scenarios", icon: GitBranch },
  { to: "/decision/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/decision/history", label: "History", icon: History },
];

export const Route = createFileRoute("/_authenticated/decision")({
  head: () => ({ meta: [{ title: "Decision — HAPPY v2.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.0 · Phase 2.7"
      title="Decision Intelligence"
      description="Structured decisions with risk, forecast, comparison, optimization and confidence — across business, financial, education, career, project and manufacturing choices."
      icon={Scale}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Domains covered", value: "8", hint: "Business, finance, career, project…" },
          { label: "Engines wired", value: "8", hint: "Decision, risk, forecast, recommend…" },
          { label: "Confidence model", value: "Ready", hint: "Bayesian + expert priors" },
          { label: "Audit trail", value: "Enabled", hint: "Reuses core audit" },
        ],
        note: "Every decision produces a comparison matrix, confidence score, forecast band, risk register and recommended action.",
      }}
    />
  ),
});

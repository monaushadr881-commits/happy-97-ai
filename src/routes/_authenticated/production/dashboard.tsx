import { createFileRoute } from "@tanstack/react-router";
import { ProductionShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/production/dashboard")({
  head: () => ({ meta: [{ title: "Production Dashboard" }] }),
  component: () => (
    <ProductionShell title="Production Dashboard" description="Live readiness across performance, security, testing, deployment, and quality.">
      <div className="grid gap-4 md:grid-cols-3">
        {["Performance", "Security", "Testing", "Deployment", "Quality", "Digital Human"].map((k) => (
          <div key={k} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="text-sm text-soft-gray">{k}</div>
            <div className="mt-2 text-paper">Aggregated from R64 / R71 / R72 / R73 signals.</div>
          </div>
        ))}
      </div>
    </ProductionShell>
  ),
});

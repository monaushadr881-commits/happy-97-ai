import { createFileRoute } from "@tanstack/react-router";
import { ProductionShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/production/security")({
  head: () => ({ meta: [{ title: "Security Audit" }] }),
  component: () => (
    <ProductionShell title="Security" description="RLS · GRANTs · signature checks · secrets · headers.">
      <p className="text-soft-gray">See docs/security/security-hardening.md.</p>
    </ProductionShell>
  ),
});

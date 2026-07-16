import { createFileRoute } from "@tanstack/react-router";
import { FaiosShell } from "./-shell";
import { Panel } from "@/design-system/primitives";

export const Route = createFileRoute("/_authenticated/founder-ai/settings")({ component: Page });

function Page() {
  return (
    <FaiosShell title="Founder AI Settings" description="Execution mode, safeguards, and integrations.">
      <Panel className="p-6 text-sm text-soft-gray space-y-3">
        <div>
          <p className="text-paper font-semibold">Execution Modes</p>
          <p>explain · suggest · preview · approval · automatic · emergency · read_only</p>
          <p className="text-xs">Default is <strong>approval</strong>. Automatic never touches auth, payments, credits, wallet, RBAC, security, database schema, or deployment credentials without explicit Founder confirmation.</p>
        </div>
        <div>
          <p className="text-paper font-semibold">Safeguards</p>
          <ul className="list-disc pl-5 text-xs">
            <li>Every command records intent, plan, risk, and impact.</li>
            <li>All state changes go through the existing RLS + audit pipeline.</li>
            <li>Native build steps mark themselves blocked with required credentials.</li>
          </ul>
        </div>
        <div>
          <p className="text-paper font-semibold">Voice</p>
          <p className="text-xs">Push-to-talk uses the browser's Speech Recognition API. Chrome/Edge recommended.</p>
        </div>
      </Panel>
    </FaiosShell>
  );
}

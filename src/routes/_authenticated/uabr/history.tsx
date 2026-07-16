import { createFileRoute } from "@tanstack/react-router";
import { UabrShell } from "./-shell";
import { Panel, EmptyState } from "@/design-system/primitives";

export const Route = createFileRoute("/_authenticated/uabr/history")({ component: Page });

function Page() {
  return (
    <UabrShell title="Build History" description="Approved plans are recorded via the Founder AI OS command log.">
      <Panel className="p-6">
        <EmptyState
          title="History lives in Founder AI"
          description="Every approved builder plan is queued as a Founder command with plan snapshot + audit trail. Visit /founder-ai/history to see the full timeline."
        />
      </Panel>
    </UabrShell>
  );
}

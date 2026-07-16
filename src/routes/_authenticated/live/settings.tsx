import { createFileRoute } from "@tanstack/react-router";
import { LiveShell } from "./-shell";
import { Panel } from "@/design-system/primitives";

export const Route = createFileRoute("/_authenticated/live/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <LiveShell title="Live Settings" description="Presence engine, notifications, privacy.">
      <Panel className="p-6 text-sm text-soft-gray space-y-2">
        <p className="text-paper font-semibold">Privacy</p>
        <p>Personalization, memory reset and export controls live on the <a className="text-gold underline" href="/live/relationship">Relationship</a> tab.</p>
        <p className="text-paper font-semibold mt-4">Presence</p>
        <p>Your device sends a heartbeat every 25s while a Live tab is open. Sessions become stale after 90s.</p>
        <p className="text-paper font-semibold mt-4">Notifications</p>
        <p>Reuses the existing Notification Platform. Human-toned templates in <code>live-notification.functions.ts</code>.</p>
      </Panel>
    </LiveShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/presence")({
  head: () => ({ meta: [{ title: "HAPPY Human Presence" }] }),
  component: () => (
    <HappyShell title="Human Presence" description="Always here. Never popping. Like a real assistant in the room.">
      <p className="text-soft-gray">HAPPY is mounted at the app shell and persists across every route. No load state, no popup, no disappearance.</p>
    </HappyShell>
  ),
});

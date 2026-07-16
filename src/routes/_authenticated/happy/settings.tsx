import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/settings")({
  head: () => ({ meta: [{ title: "HAPPY Settings" }] }),
  component: () => (
    <HappyShell title="Settings" description="Dock position · display mode · quality tier · voice · accessibility.">
      <div className="grid gap-3 md:grid-cols-2 text-soft-gray">
        <Row k="Default dock" v="bottom-right" />
        <Row k="Default mode" v="floating" />
        <Row k="Quality tier" v="auto" />
        <Row k="Voice" v="push-to-talk + wake word" />
        <Row k="Reduced motion" v="honors OS preference" />
        <Row k="Camera / mic" v="opt-in per session" />
      </div>
    </HappyShell>
  ),
});

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="text-xs uppercase tracking-wide text-soft-gray/70">{k}</div>
      <div className="text-paper mt-1">{v}</div>
    </div>
  );
}

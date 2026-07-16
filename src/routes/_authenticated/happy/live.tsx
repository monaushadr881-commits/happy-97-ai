import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/live")({
  head: () => ({ meta: [{ title: "HAPPY Live — Cinematic Digital Human" }] }),
  component: LivePage,
});

function LivePage() {
  return (
    <HappyShell title="HAPPY Live" description="One HAPPY. Available across every surface.">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="State" body="idle → entering → walking → listening → thinking → speaking → exiting" />
        <Card title="Modes" body="floating · sidebar · mini · dock · fullscreen · presentation · pip · meeting" />
        <Card title="Triggers" body='"Hi HAPPY" · button · mic · hotkey (⌘⇧H)' />
        <Card title="Awareness" body="Route · Builder · Project · Component · Errors · Deployment" />
      </div>
    </HappyShell>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="text-sm text-soft-gray">{title}</div>
      <div className="mt-2 text-paper">{body}</div>
    </div>
  );
}

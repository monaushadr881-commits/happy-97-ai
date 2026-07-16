import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/video")({
  head: () => ({ meta: [{ title: "HAPPY Video" }] }),
  component: () => (
    <HappyShell title="Video" description="Face-to-face with HAPPY. Camera is opt-in.">
      <p className="text-soft-gray">Camera is never activated without explicit consent.</p>
    </HappyShell>
  ),
});

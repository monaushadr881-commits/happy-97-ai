import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/presentation")({
  head: () => ({ meta: [{ title: "HAPPY Presentation Mode" }] }),
  component: () => (
    <HappyShell title="Presentation Mode" description="Full-screen HAPPY for demos, meetings, and keynotes." >
      <p className="text-soft-gray">Presentation mode expands the stage to full-viewport with meeting-camera framing.</p>
    </HappyShell>
  ),
});

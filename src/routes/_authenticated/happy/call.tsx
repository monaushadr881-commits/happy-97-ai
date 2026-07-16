import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/call")({
  head: () => ({ meta: [{ title: "Call HAPPY" }] }),
  component: () => (
    <HappyShell title="Call HAPPY" description="Push-to-talk, continuous conversation, interrupt support.">
      <p className="text-soft-gray">Microphone is only activated after you press Call. All voice runs on the existing browser SpeechRecognition + platform TTS pipeline.</p>
    </HappyShell>
  ),
});

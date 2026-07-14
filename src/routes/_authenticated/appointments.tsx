/** /appointments — Appointment Platform · v9.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({ meta: [{ title: "Appointment Platform — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Appointment Platform · v9.0"
      title="Appointment Platform"
      description="Appointment booking, doctor schedules, queue management, video consultation, follow-ups, reminders, tokens and waiting rooms."
      icon={CalendarClock}
      features={["Booking","Doctor Schedule","Queue","Video Consult","Follow-ups","Reminders","Token System","Waiting Room"]}
    />
  ),
});

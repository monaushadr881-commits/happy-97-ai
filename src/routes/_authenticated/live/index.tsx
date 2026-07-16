import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/live/")({
  beforeLoad: () => { throw redirect({ to: "/live/dashboard" }); },
});

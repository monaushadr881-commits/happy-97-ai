import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/releases/")({
  beforeLoad: () => { throw redirect({ to: "/releases/dashboard" }); },
});

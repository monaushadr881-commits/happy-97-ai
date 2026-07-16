import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/happy/")({
  component: () => <Navigate to="/happy/live" />,
});

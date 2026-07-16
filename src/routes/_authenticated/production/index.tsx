import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/production/")({
  component: () => <Navigate to="/production/dashboard" />,
});

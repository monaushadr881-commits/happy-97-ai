import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — HAPPY X" },
      { name: "description", content: "Sign in to the HAPPY Enterprise Identity Platform." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Navigate to="/auth" replace />,
});

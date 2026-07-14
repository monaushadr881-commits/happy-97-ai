import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — HAPPY X" },
      { name: "description", content: "Create your HAPPY Enterprise Identity account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Navigate to="/auth" replace search={{ mode: "signup" } as never} />,
});

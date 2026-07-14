/**
 * HAPPY X — Public API v1 Health
 * External health endpoint. Bypasses auth (under /api/public/*).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/v1/health")({
  server: {
    handlers: {
      GET: async () => Response.json({
        ok: true,
        service: "happy-x",
        version: "v1",
        ts: new Date().toISOString(),
      }),
    },
  },
});

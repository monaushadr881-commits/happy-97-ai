/**
 * HAPPY X — Public status endpoint.
 * External monitors call this every N seconds. Returns a compact JSON
 * status snapshot. No auth (under /api/public/*); no PII.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/v1/status")({
  server: {
    handlers: {
      GET: async () => {
        const gatewayKey = process.env.LOVABLE_API_KEY ? "configured" : "missing";
        return Response.json({
          service: "happy-x",
          version: "v1",
          uptime: "ok",
          aiGatewayKey: gatewayKey,
          ts: new Date().toISOString(),
        }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});

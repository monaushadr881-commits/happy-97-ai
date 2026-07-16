/** R64 — refresh store status snapshot. Authenticated via CRON_SHARED_SECRET (R106). */
import { createFileRoute } from "@tanstack/react-router";
import { monitorAllStores } from "@/lib/release-r64/store-monitors";
import { assertCronAuth } from "@/lib/security/cron-auth";

export const Route = createFileRoute("/api/public/cron/release-store-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = assertCronAuth(request);
        if (denied) return denied;
        return Response.json({
          ok: true,
          generated_at: new Date().toISOString(),
          stores: monitorAllStores(),
          note: "Real store metric ingest is blocked until store API credentials are configured.",
        });
      },
    },
  },
});

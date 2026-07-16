/** R64 — refresh store status snapshot. Records blocked_reason honestly. */
import { createFileRoute } from "@tanstack/react-router";
import { monitorAllStores } from "@/lib/release-r64/store-monitors";

export const Route = createFileRoute("/api/public/cron/release-store-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? "";
        if (!process.env.SUPABASE_PUBLISHABLE_KEY || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }
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

/**
 * R17 — CMS scheduled publish tick.
 *
 * Publishes any content where status='scheduled' AND scheduled_at <= now().
 * Authenticated via the CRON_SHARED_SECRET (server-only) — R106.
 */
import { createFileRoute } from "@tanstack/react-router";
import { tickScheduledPublish } from "@/lib/cms/engine";
import { assertCronAuth } from "@/lib/security/cron-auth";

export const Route = createFileRoute("/api/public/cron/cms-publish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = assertCronAuth(request);
        if (denied) return denied;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const r = await tickScheduledPublish(supabaseAdmin);
          return Response.json(r);
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

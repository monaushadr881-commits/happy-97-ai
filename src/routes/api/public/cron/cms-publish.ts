/**
 * R17 — CMS scheduled publish tick.
 *
 * Publishes any content where status='scheduled' AND scheduled_at <= now().
 * Authenticated with the Supabase publishable apikey header per
 * schedule-jobs pattern.
 */
import { createFileRoute } from "@tanstack/react-router";
import { tickScheduledPublish } from "@/lib/cms/engine";

export const Route = createFileRoute("/api/public/cron/cms-publish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401, headers: { "Content-Type": "application/json" },
          });
        }
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

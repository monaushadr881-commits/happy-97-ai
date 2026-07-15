/**
 * HAPPY — Notification Center server functions.
 * All handlers execute as the signed-in user; RLS on notifications/
 * notification_preferences confines every row to auth.uid().
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { notificationService } from "@/services/domain/notification.service";

type AuthCtx = {
  supabase: Parameters<typeof makeServiceContext>[0]["supabase"];
  userId: string;
  claims?: Record<string, unknown>;
};

const svc = (ctx: AuthCtx) =>
  makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });

const guard = <T>(fn: () => Promise<T>) =>
  fn().catch((e) => {
    throw toAppError(e);
  });

// ─── Reads ────────────────────────────────────────────────────────────────
export const notifList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { filter?: "all" | "unread" | "read"; kind?: string; limit?: number } | undefined) => i ?? {})
  .handler(({ data, context }) => guard(() => notificationService.list(svc(context), data)));

export const notifUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => guard(() => notificationService.unreadCount(svc(context))));

export const notifCategoryCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => guard(() => notificationService.categoryCounts(svc(context))));

// ─── Mutations ────────────────────────────────────────────────────────────
export const notifMarkRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(({ data, context }) => guard(() => notificationService.markRead(svc(context), data.id)));

export const notifMarkUnread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(({ data, context }) => guard(() => notificationService.markUnread(svc(context), data.id)));

export const notifMarkAllRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => guard(() => notificationService.markAllRead(svc(context))));

export const notifDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(({ data, context }) => guard(() => notificationService.remove(svc(context), data.id)));

// ─── Preferences ──────────────────────────────────────────────────────────
export const notifPrefsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => guard(() => notificationService.listPreferences(svc(context))));

export const notifPrefUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { kind: string; channel: "in_app" | "email" | "sms" | "push" | "webhook"; enabled: boolean }) => i)
  .handler(({ data, context }) => guard(() => notificationService.upsertPreference(svc(context), data)));

// ─── Dev seed (self only) ─────────────────────────────────────────────────
export const notifDevSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    guard(async () => {
      const samples = [
        { kind: "system", title: "Welcome to HAPPY", body: "Your notification center is live." },
        { kind: "security", title: "New sign-in from Chrome", body: "If this wasn't you, review your sessions." },
        { kind: "deployment", title: "Deployment succeeded", body: "app.example.com · v42 is live." },
        { kind: "marketplace", title: "New listing approved", body: "Your listing is now discoverable." },
        { kind: "billing", title: "Invoice paid", body: "$29.00 · Pro plan." },
        { kind: "digital_human", title: "HAPPY finished a session", body: "Summary is available in the transcript." },
      ];
      for (const s of samples) {
        await notificationService.send(svc(context), { user_id: context.userId, ...s });
      }
      return { ok: true, inserted: samples.length };
    }),
  );

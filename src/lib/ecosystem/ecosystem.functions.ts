/**
 * R37 — Enterprise Ecosystem server functions (auth-gated where required).
 *
 * Public reads (categories, active collections, featured, latest fact
 * recommendations, creator profiles) do not require auth so store URLs
 * are shareable. Every mutation requires auth; ops-admin gates are
 * enforced in the engine layer.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  checkCompatibility, computeFactRecommendations, creatorDashboard,
  deactivateCategory, ecosystemOverview, featureListing,
  getCollectionWithItems, getCreatorProfile, getLatestFactRecommendations,
  listCategories, listCollections, listFeatured, markPayoutSettled,
  openSupportTicket, pinToCollection, requestPayout, setCompatibility,
  unfeatureSlot, unpinFromCollection, updateSupportTicket,
  upsertCategory, upsertCollection, upsertCreatorProfile, verifyCreator,
  type CategoryUpsert, type CollectionUpsert, type CompatibilityInput,
  type CreatorProfileInput, type FeatureInput, type PayoutInput,
  type SupportTicketInput,
} from "./engine";

type Ctx = { supabase: unknown; userId: string };
type SB = SupabaseClient<Database>;

function publicClient(): SB {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/* ------------------------------ public reads ------------------------ */

export const ecosystemListCategories = createServerFn({ method: "GET" })
  .handler(async () => listCategories(publicClient()));

export const ecosystemListCollections = createServerFn({ method: "GET" })
  .handler(async () => listCollections(publicClient()));

export const ecosystemGetCollection = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string; limit?: number }) => d)
  .handler(async ({ data }) => getCollectionWithItems(publicClient(), data.code, data.limit));

export const ecosystemListFeatured = createServerFn({ method: "GET" })
  .inputValidator((d: { slotCode?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => listFeatured(publicClient(), data.slotCode));

export const ecosystemLatestFactRecs = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number } | undefined) => d ?? {})
  .handler(async ({ data }) => getLatestFactRecommendations(publicClient(), data.limit ?? 12));

export const ecosystemGetCreatorProfile = createServerFn({ method: "GET" })
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data }) => getCreatorProfile(publicClient(), data.userId));

export const ecosystemCheckCompatibility = createServerFn({ method: "GET" })
  .inputValidator((d: { listingId: string; listingVersion: number; platformVersion?: string }) => d)
  .handler(async ({ data }) => checkCompatibility(publicClient(), data));

/* ------------------------------ authenticated ----------------------- */

export const ecosystemUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CategoryUpsert) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "ecosystemUpsertCategory", source: "api", module: "ecosystem.ecosystemUpsertCategory" });
    const c = context as Ctx;
    return upsertCategory(c.supabase as SB, c.userId, data);
  });

export const ecosystemDeactivateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "ecosystemDeactivateCategory", source: "api", module: "ecosystem.ecosystemDeactivateCategory" });
    const c = context as Ctx;
    return deactivateCategory(c.supabase as SB, c.userId, data.code);
  });

export const ecosystemUpsertCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CollectionUpsert) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "ecosystemUpsertCollection", source: "api", module: "ecosystem.ecosystemUpsertCollection" });
    const c = context as Ctx;
    return upsertCollection(c.supabase as SB, c.userId, data);
  });

export const ecosystemPinToCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string; listingId: string; position?: number }) => d)
  .handler(async ({ data, context }) => {
    const c = context as Ctx;
    return pinToCollection(c.supabase as SB, c.userId, data.code, data.listingId, data.position ?? 0);
  });

export const ecosystemUnpinFromCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string; listingId: string }) => d)
  .handler(async ({ data, context }) => {
    const c = context as Ctx;
    return unpinFromCollection(c.supabase as SB, c.userId, data.code, data.listingId);
  });

export const ecosystemFeatureListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: FeatureInput) => d)
  .handler(async ({ data, context }) => {
    const c = context as Ctx;
    return featureListing(c.supabase as SB, c.userId, data);
  });

export const ecosystemUnfeatureSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slotId: string }) => d)
  .handler(async ({ data, context }) => {
    const c = context as Ctx;
    return unfeatureSlot(c.supabase as SB, c.userId, data.slotId);
  });

export const ecosystemSetCompatibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CompatibilityInput) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "ecosystemSetCompatibility", source: "api", module: "ecosystem.ecosystemSetCompatibility" });
    const c = context as Ctx;
    return setCompatibility(c.supabase as SB, c.userId, data);
  });

export const ecosystemComputeFactRecs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { scope?: "global" | "user"; limit?: number } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "ecosystemComputeFactRecs", source: "api", module: "ecosystem.ecosystemComputeFactRecs" });
    const c = context as Ctx;
    return computeFactRecommendations(c.supabase as SB, c.userId, data.scope ?? "global", data.limit ?? 12);
  });

export const ecosystemUpsertCreatorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CreatorProfileInput) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "ecosystemUpsertCreatorProfile", source: "api", module: "ecosystem.ecosystemUpsertCreatorProfile" });
    const c = context as Ctx;
    return upsertCreatorProfile(c.supabase as SB, c.userId, data);
  });

export const ecosystemVerifyCreator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { creatorUserId: string; verified: boolean }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "ecosystemVerifyCreator", source: "api", module: "ecosystem.ecosystemVerifyCreator" });
    const c = context as Ctx;
    return verifyCreator(c.supabase as SB, c.userId, data.creatorUserId, data.verified);
  });

export const ecosystemCreatorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const c = context as Ctx;
    return creatorDashboard(c.supabase as SB, c.userId);
  });

export const ecosystemRequestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: PayoutInput) => d)
  .handler(async ({ data, context }) => {
    const c = context as Ctx;
    return requestPayout(c.supabase as SB, c.userId, data);
  });

export const ecosystemMarkPayoutSettled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { payoutId: string; walletLedgerId?: string | null; reference?: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "ecosystemMarkPayoutSettled", source: "api", module: "ecosystem.ecosystemMarkPayoutSettled" });
    const c = context as Ctx;
    return markPayoutSettled(c.supabase as SB, c.userId, data.payoutId, data.walletLedgerId ?? null, data.reference);
  });

export const ecosystemOpenSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: SupportTicketInput) => d)
  .handler(async ({ data, context }) => {
    const c = context as Ctx;
    return openSupportTicket(c.supabase as SB, c.userId, data);
  });

export const ecosystemUpdateSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; status?: string; priority?: string; body?: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "ecosystemUpdateSupportTicket", source: "api", module: "ecosystem.ecosystemUpdateSupportTicket" });
    const c = context as Ctx;
    return updateSupportTicket(c.supabase as SB, c.userId, data.ticketId, {
      status: data.status, priority: data.priority, body: data.body,
    });
  });

export const ecosystemOverviewFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const c = context as Ctx;
    return ecosystemOverview(c.supabase as SB, c.userId);
  });

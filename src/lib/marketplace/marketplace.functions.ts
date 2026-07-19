/**
 * R16 — Marketplace server functions (auth-gated where required).
 *
 * Public reads (catalog, single listing) do NOT require auth so shareable
 * listing URLs work on the published site. Purchases, downloads, reviews,
 * approvals, and seller mutations require auth (and ownership / ops-admin
 * for privileged actions).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  ASSET_TYPES, PURCHASE_TYPES,
  approveListing, archiveListing, authorizeDownload,
  createListing, getPublishedListing, hideListing, listCatalog,
  listPendingReview, listSellerListings, listWishlist,
  marketplaceOverview, publishNewVersion, purchaseListing, refundPurchase,
  rejectListing, sellerAnalytics, settlePendingPurchase, submitForReview,
  submitReview, toggleWishlist, updateListing,
  type AssetType, type CatalogFilter, type PurchaseType,
} from "./engine";

type Ctx = { supabase: unknown; userId: string };

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    },
  );
}

async function assertSellerOwns(ctx: Ctx, listingId: string) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.from("listings")
    .select("seller_id").eq("id", listingId).maybeSingle();
  if (error) throw new Error(`db_read_failed: ${error.message}`);
  if (!data) throw new Error("listing_not_found");
  if ((data as { seller_id: string }).seller_id !== ctx.userId) {
    const { data: ops } = await sb.rpc("is_ops_admin", { _user_id: ctx.userId });
    if (!ops) throw new Error("Forbidden: not listing owner");
  }
}

async function assertOpsAdmin(ctx: Ctx) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.rpc("is_ops_admin", { _user_id: ctx.userId });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: ops admin required");
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  // Stable non-reversible per-day bucket for rate-analysis without storing PII.
  const day = new Date().toISOString().slice(0, 10);
  let h = 0;
  const s = `${ip}|${day}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(36)}`;
}

/* ------------------------------ public catalog ---------------------- */

export const browseCatalog = createServerFn({ method: "GET" })
  .inputValidator((d: CatalogFilter) => d ?? {})
  .handler(async ({ data }) => {
    const sb = publicClient();
    return listCatalog(sb, data);
  });

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((d: { listingId: string }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    return getPublishedListing(sb, data.listingId);
  });

/* ------------------------------ seller ------------------------------ */

export const createSellerListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    title: string; assetType: AssetType; purchaseType: PurchaseType;
    description?: string; longDescription?: string; category?: string;
    tags?: string[]; priceCents?: number; priceCredits?: number;
    currency?: string; subscriptionPlanId?: string | null;
    coverUrl?: string; previewUrls?: string[]; artifactPath?: string;
  }) => {
    if (!ASSET_TYPES.includes(d.assetType)) throw new Error("invalid_asset_type");
    if (!PURCHASE_TYPES.includes(d.purchaseType)) throw new Error("invalid_purchase_type");
    return d;
  })
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "createSellerListing", source: "api", module: "marketplace.createSellerListing" });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return createListing(supabaseAdmin, { ...data, sellerId: (context as Ctx).userId });
  });

export const updateSellerListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "updateSellerListing", source: "api", module: "marketplace.updateSellerListing" });
    await assertSellerOwns(context as Ctx, data.listingId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return updateListing(supabaseAdmin, data.listingId, data.patch);
  });

export const publishListingVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    listingId: string; changelog: string;
    artifactPath?: string; artifactBytes?: number;
  }) => {
    if (!d?.changelog?.trim()) throw new Error("changelog_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "publishListingVersion", source: "api", module: "marketplace.publishListingVersion" });
    await assertSellerOwns(context as Ctx, data.listingId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return publishNewVersion(supabaseAdmin, { ...data, sellerId: (context as Ctx).userId });
  });

export const submitListingForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "submitListingForReview", source: "api", module: "marketplace.submitListingForReview" });
    await assertSellerOwns(context as Ctx, data.listingId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return submitForReview(supabaseAdmin, data.listingId, (context as Ctx).userId);
  });

export const archiveSellerListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "archiveSellerListing", source: "api", module: "marketplace.archiveSellerListing" });
    await assertSellerOwns(context as Ctx, data.listingId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return archiveListing(supabaseAdmin, data.listingId);
  });

export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listSellerListings(supabaseAdmin, (context as Ctx).userId);
  });

export const getSellerAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return sellerAnalytics(supabaseAdmin, (context as Ctx).userId);
  });

/* ------------------------------ founder ----------------------------- */

export const listPendingReviewListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listPendingReview(supabaseAdmin);
  });

export const approveListingByFounder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "approveListingByFounder", source: "api", module: "marketplace.approveListingByFounder" });
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return approveListing(supabaseAdmin, data.listingId, (context as Ctx).userId);
  });

export const rejectListingByFounder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string; reason: string }) => {
    if (!d?.reason?.trim()) throw new Error("reason_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "rejectListingByFounder", source: "api", module: "marketplace.rejectListingByFounder" });
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return rejectListing(supabaseAdmin, data.listingId, (context as Ctx).userId, data.reason);
  });

export const hideListingByFounder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string; reason: string }) => {
    if (!d?.reason?.trim()) throw new Error("reason_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return hideListing(supabaseAdmin, data.listingId, (context as Ctx).userId, data.reason);
  });

export const getMarketplaceOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return marketplaceOverview(supabaseAdmin);
  });

/* ------------------------------ buyer ------------------------------- */

export const purchaseMarketplaceListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return purchaseListing(supabaseAdmin, {
      listingId: data.listingId, buyerId: (context as Ctx).userId,
    });
  });

export const settleMarketplacePurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { transactionId: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "settleMarketplacePurchase", source: "api", module: "marketplace.settleMarketplacePurchase" });
    // Called by the payments webhook route or ops admin only.
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return settlePendingPurchase(supabaseAdmin, data.transactionId);
  });

export const requestListingDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ua = getRequestHeader("user-agent") ?? null;
    const fwd = getRequestHeader("x-forwarded-for") ?? "";
    const ip = fwd.split(",")[0]?.trim() || null;
    return authorizeDownload(supabaseAdmin, {
      listingId: data.listingId, buyerId: (context as Ctx).userId,
      ipHash: hashIp(ip), userAgent: ua ?? undefined,
    });
  });

export const submitListingReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string; rating: number; body?: string }) => {
    if (!Number.isFinite(d?.rating)) throw new Error("rating_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "submitListingReview", source: "api", module: "marketplace.submitListingReview" });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return submitReview(supabaseAdmin, {
      listingId: data.listingId, reviewerId: (context as Ctx).userId,
      rating: data.rating, body: data.body,
    });
  });

export const toggleListingWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "toggleListingWishlist", source: "api", module: "marketplace.toggleListingWishlist" });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return toggleWishlist(supabaseAdmin, data.listingId, (context as Ctx).userId);
  });

export const listMyWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listWishlist(supabaseAdmin, (context as Ctx).userId);
  });

export const refundListingPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { purchaseId: string; reason: string }) => {
    if (!d?.reason?.trim()) throw new Error("reason_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "refundListingPurchase", source: "api", module: "marketplace.refundListingPurchase" });
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return refundPurchase(supabaseAdmin, data.purchaseId, (context as Ctx).userId, data.reason);
  });

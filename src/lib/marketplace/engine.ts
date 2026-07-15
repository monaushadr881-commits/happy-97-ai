/**
 * R16 — Enterprise Marketplace Runtime (server-only)
 *
 * Reuses:
 *   - Revenue Cloud (marketplace_transactions rows for paid orders)
 *   - Wallet   (postLedgerEntry — debit buyer, credit seller earnings)
 *   - Credits  (consume — debit buyer credits balance)
 *   - Notification platform (in_app kind = "marketplace.*")
 *   - Founder Dashboard (getMarketplaceOverview aggregates)
 *
 * Only actions that are actually implementable become WORKING. Card-based
 * settlement stays PENDING until the payments provider webhook lands the
 * successful charge — we never claim settled revenue without evidence.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { postLedgerEntry } from "@/lib/wallet/engine";
import { consume as consumeCredits } from "@/lib/credits/engine";

type SB = SupabaseClient<Database>;

/* ------------------------------ types ------------------------------- */

export type AssetType =
  | "website_template" | "app_template" | "component" | "ui_kit" | "theme"
  | "icons" | "images" | "videos" | "fonts" | "plugin" | "extension"
  | "ai_workflow" | "automation_pack" | "prompt_pack"
  | "digital_human_asset" | "business_template" | "crm_template"
  | "erp_template" | "finance_template";

export type PurchaseType =
  | "free" | "one_time" | "subscription" | "credits" | "wallet" | "enterprise";

export type ReviewStatus =
  | "draft" | "pending_review" | "approved" | "published"
  | "hidden" | "rejected" | "archived";

export const ASSET_TYPES: readonly AssetType[] = [
  "website_template","app_template","component","ui_kit","theme","icons",
  "images","videos","fonts","plugin","extension","ai_workflow",
  "automation_pack","prompt_pack","digital_human_asset","business_template",
  "crm_template","erp_template","finance_template",
];
export const PURCHASE_TYPES: readonly PurchaseType[] = [
  "free","one_time","subscription","credits","wallet","enterprise",
];

export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

/* ------------------------------ helpers ----------------------------- */

async function audit(sb: SB, action: string, listingId: string, meta: Record<string, unknown>) {
  try {
    await sb.rpc("write_audit", {
      _category: "marketplace",
      _action: action,
      _entity_type: "listings",
      _entity_id: listingId,
      _metadata: meta as never,
    });
  } catch { /* best effort */ }
}

async function notify(sb: SB, userId: string, event: string, payload: Record<string, unknown>) {
  try {
    await sb.from("notifications").insert({
      user_id: userId,
      kind: `marketplace.${event}`,
      title: `Marketplace: ${event.replace(/_/g, " ")}`,
      body: JSON.stringify(payload),
      channel: "in_app",
      metadata: payload as never,
    } as never);
  } catch { /* best effort */ }
}

function slugify(input: string): string {
  const base = input.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "listing";
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${base}-${suffix}`;
}

async function loadListing(sb: SB, id: string): Promise<ListingRow> {
  const { data, error } = await sb.from("listings")
    .select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("listing_not_found");
  return data as ListingRow;
}

/* ------------------------------ listings ---------------------------- */

export interface CreateListingInput {
  sellerId: string;
  title: string;
  assetType: AssetType;
  purchaseType: PurchaseType;
  description?: string;
  longDescription?: string;
  category?: string;
  tags?: string[];
  priceCents?: number;
  priceCredits?: number;
  currency?: string;
  subscriptionPlanId?: string | null;
  coverUrl?: string;
  previewUrls?: string[];
  artifactPath?: string;
  metadata?: Record<string, unknown>;
}

export async function createListing(sb: SB, input: CreateListingInput) {
  if (!input.title?.trim()) throw new Error("title_required");
  if (!ASSET_TYPES.includes(input.assetType)) throw new Error("invalid_asset_type");
  if (!PURCHASE_TYPES.includes(input.purchaseType)) throw new Error("invalid_purchase_type");
  if (input.purchaseType === "subscription" && !input.subscriptionPlanId) {
    throw new Error("subscription_plan_required");
  }
  const priceCents = Math.max(0, Math.floor(input.priceCents ?? 0));
  const priceCredits = Math.max(0, Math.floor(input.priceCredits ?? 0));
  if (input.purchaseType === "one_time" && priceCents <= 0) {
    throw new Error("price_required_for_one_time");
  }
  if (input.purchaseType === "credits" && priceCredits <= 0) {
    throw new Error("price_credits_required");
  }
  if (input.purchaseType === "wallet" && priceCents <= 0) {
    throw new Error("wallet_price_required");
  }

  const { data, error } = await sb.from("listings").insert({
    seller_id: input.sellerId,
    slug: slugify(input.title),
    title: input.title.trim(),
    description: input.description ?? null,
    long_description: input.longDescription ?? null,
    category: input.category ?? null,
    tags: (input.tags ?? []) as never,
    asset_type: input.assetType,
    purchase_type: input.purchaseType,
    price_cents: priceCents,
    price_credits: priceCredits,
    currency: (input.currency ?? "USD").toUpperCase(),
    subscription_plan_id: input.subscriptionPlanId ?? null,
    cover_url: input.coverUrl ?? null,
    preview_urls: (input.previewUrls ?? []) as never,
    artifact_path: input.artifactPath ?? null,
    status: "draft" as never,
    review_status: "draft",
    created_by: input.sellerId,
    metadata: (input.metadata ?? {}) as never,
  } as never).select("*").single();
  if (error) throw error;

  const row = data as ListingRow;
  // Seed v1
  await sb.from("listing_versions").insert({
    listing_id: row.id,
    version: 1,
    changelog: "Initial version",
    artifact_path: input.artifactPath ?? null,
    created_by: input.sellerId,
  } as never);
  await audit(sb, "listing.created", row.id, { title: row.title, assetType: input.assetType });
  return row;
}

export async function updateListing(sb: SB, id: string, patch: Partial<CreateListingInput>) {
  const upd: Record<string, unknown> = {};
  if (patch.title !== undefined)         upd.title = patch.title.trim();
  if (patch.description !== undefined)   upd.description = patch.description;
  if (patch.longDescription !== undefined) upd.long_description = patch.longDescription;
  if (patch.category !== undefined)      upd.category = patch.category;
  if (patch.tags !== undefined)          upd.tags = patch.tags;
  if (patch.coverUrl !== undefined)      upd.cover_url = patch.coverUrl;
  if (patch.previewUrls !== undefined)   upd.preview_urls = patch.previewUrls;
  if (patch.priceCents !== undefined)    upd.price_cents = Math.max(0, Math.floor(patch.priceCents));
  if (patch.priceCredits !== undefined)  upd.price_credits = Math.max(0, Math.floor(patch.priceCredits));
  if (patch.currency !== undefined)      upd.currency = patch.currency.toUpperCase();
  if (patch.subscriptionPlanId !== undefined) upd.subscription_plan_id = patch.subscriptionPlanId;
  if (patch.metadata !== undefined)      upd.metadata = patch.metadata;
  if (Object.keys(upd).length === 0) return await loadListing(sb, id);

  const { data, error } = await sb.from("listings")
    .update(upd as never).eq("id", id).select("*").single();
  if (error) throw error;
  await audit(sb, "listing.updated", id, { fields: Object.keys(upd) });
  return data as ListingRow;
}

export async function publishNewVersion(sb: SB, args: {
  listingId: string; sellerId: string; changelog: string;
  artifactPath?: string; artifactBytes?: number;
}) {
  const l = await loadListing(sb, args.listingId);
  const nextVersion = l.current_version + 1;
  const { data: v, error: vErr } = await sb.from("listing_versions").insert({
    listing_id: l.id,
    version: nextVersion,
    changelog: args.changelog,
    artifact_path: args.artifactPath ?? l.artifact_path,
    artifact_bytes: args.artifactBytes ?? null,
    created_by: args.sellerId,
  } as never).select("*").single();
  if (vErr) throw vErr;

  await sb.from("listings").update({
    current_version: nextVersion,
    artifact_path: args.artifactPath ?? l.artifact_path,
  } as never).eq("id", l.id);

  await audit(sb, "listing.version_published", l.id, { version: nextVersion });

  // Notify all active buyers that a new version is available.
  const { data: purchases } = await sb.from("listing_purchases")
    .select("buyer_id").eq("listing_id", l.id).eq("status", "active");
  for (const p of (purchases ?? []) as Array<{ buyer_id: string }>) {
    await notify(sb, p.buyer_id, "update_available", {
      listingId: l.id, title: l.title, newVersion: nextVersion,
    });
  }
  return v;
}

/* ------------------------------ approval flow ----------------------- */

export async function submitForReview(sb: SB, id: string, actorId: string) {
  const l = await loadListing(sb, id);
  if (!["draft", "rejected"].includes(l.review_status)) {
    throw new Error(`cannot_submit_from_${l.review_status}`);
  }
  const { data, error } = await sb.from("listings").update({
    review_status: "pending_review",
    rejected_reason: null,
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  await audit(sb, "listing.submitted", id, { title: l.title });
  await notify(sb, actorId, "listing_submitted",
    { listingId: id, title: l.title });
  return data as ListingRow;
}

export async function approveListing(sb: SB, id: string, opsAdminId: string) {
  const l = await loadListing(sb, id);
  if (l.review_status !== "pending_review") throw new Error("not_pending_review");
  const now = new Date().toISOString();
  const { data, error } = await sb.from("listings").update({
    review_status: "published",
    status: "active" as never,
    approved_by: opsAdminId,
    approved_at: now,
    published_at: now,
    rejected_reason: null,
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  await audit(sb, "listing.approved", id, { title: l.title, approvedBy: opsAdminId });
  await notify(sb, l.seller_id, "listing_approved",
    { listingId: id, title: l.title });
  return data as ListingRow;
}

export async function rejectListing(sb: SB, id: string, opsAdminId: string, reason: string) {
  if (!reason?.trim()) throw new Error("reason_required");
  const l = await loadListing(sb, id);
  if (l.review_status !== "pending_review") throw new Error("not_pending_review");
  const { data, error } = await sb.from("listings").update({
    review_status: "rejected",
    rejected_reason: reason,
    approved_by: opsAdminId,
    approved_at: new Date().toISOString(),
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  await audit(sb, "listing.rejected", id, { title: l.title, reason });
  await notify(sb, l.seller_id, "listing_rejected",
    { listingId: id, title: l.title, reason });
  return data as ListingRow;
}

export async function hideListing(sb: SB, id: string, opsAdminId: string, reason: string) {
  const l = await loadListing(sb, id);
  const { data, error } = await sb.from("listings").update({
    review_status: "hidden", status: "suspended" as never,
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  await audit(sb, "listing.hidden", id, { title: l.title, reason, by: opsAdminId });
  await notify(sb, l.seller_id, "listing_hidden",
    { listingId: id, title: l.title, reason });
  return data as ListingRow;
}

export async function archiveListing(sb: SB, id: string) {
  const { data, error } = await sb.from("listings").update({
    review_status: "archived", status: "archived" as never,
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  await audit(sb, "listing.archived", id, {});
  return data as ListingRow;
}

/* ------------------------------ catalog ----------------------------- */

export interface CatalogFilter {
  assetType?: AssetType;
  category?: string;
  tag?: string;
  purchaseType?: PurchaseType;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: "recent" | "top_rated" | "most_downloaded";
}

export async function listCatalog(sb: SB, f: CatalogFilter = {}) {
  let q = sb.from("listings").select("*", { count: "exact" })
    .eq("review_status", "published");
  if (f.assetType)    q = q.eq("asset_type", f.assetType);
  if (f.category)     q = q.eq("category", f.category);
  if (f.purchaseType) q = q.eq("purchase_type", f.purchaseType);
  if (f.tag)          q = q.contains("tags", [f.tag] as never);
  if (f.search)       q = q.ilike("title", `%${f.search.replace(/[%_]/g, "")}%`);

  switch (f.sort) {
    case "top_rated":       q = q.order("rating_avg", { ascending: false }); break;
    case "most_downloaded": q = q.order("download_count", { ascending: false }); break;
    default:                q = q.order("published_at", { ascending: false });
  }
  const limit = Math.min(100, Math.max(1, f.limit ?? 24));
  const offset = Math.max(0, f.offset ?? 0);
  q = q.range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { items: (data ?? []) as ListingRow[], total: count ?? 0, limit, offset };
}

export async function getPublishedListing(sb: SB, id: string) {
  const l = await loadListing(sb, id);
  if (l.review_status !== "published") throw new Error("listing_not_available");
  await sb.from("listings").update({
    view_count: (l.view_count ?? 0) + 1,
  } as never).eq("id", id);
  return l;
}

export async function listSellerListings(sb: SB, sellerId: string) {
  const { data, error } = await sb.from("listings")
    .select("*").eq("seller_id", sellerId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ListingRow[];
}

export async function listPendingReview(sb: SB) {
  const { data, error } = await sb.from("listings")
    .select("*").eq("review_status", "pending_review")
    .order("updated_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ListingRow[];
}

/* ------------------------------ purchase ---------------------------- */

export interface PurchaseInput {
  listingId: string;
  buyerId: string;
}

/**
 * Executes a purchase. Free/credits/wallet purchases settle immediately and
 * create an entitlement. one_time/subscription create a PENDING
 * `marketplace_transactions` row and return it — settlement flips to
 * "succeeded" only when the payments webhook lands.
 */
export async function purchaseListing(sb: SB, input: PurchaseInput) {
  const l = await loadListing(sb, input.listingId);
  if (l.review_status !== "published") throw new Error("listing_not_available");
  if (l.seller_id === input.buyerId) throw new Error("seller_cannot_buy_own_listing");

  // Prevent duplicate entitlement for the same version.
  const dup = await sb.from("listing_purchases")
    .select("id").eq("listing_id", l.id)
    .eq("buyer_id", input.buyerId)
    .eq("version_at_purchase", l.current_version)
    .eq("status", "active").maybeSingle();
  if (dup.data) {
    return { alreadyOwned: true, purchaseId: (dup.data as { id: string }).id };
  }

  const base = {
    listing_id: l.id,
    buyer_id: input.buyerId,
    seller_id: l.seller_id,
    purchase_type: l.purchase_type,
    price_cents: l.price_cents,
    price_credits: l.price_credits,
    currency: l.currency,
    version_at_purchase: l.current_version,
    status: "active",
  };

  if (l.purchase_type === "free") {
    const { data, error } = await sb.from("listing_purchases")
      .insert(base as never).select("*").single();
    if (error) throw error;
    await onPurchaseSettled(sb, l, input.buyerId, "free");
    return { settled: true, purchase: data };
  }

  if (l.purchase_type === "credits") {
    if (l.price_credits <= 0) throw new Error("invalid_credit_price");
    const consumed = await consumeCredits(sb, {
      ownerType: "user",
      ownerId: input.buyerId,
      amount: Number(l.price_credits),
      entryType: "marketplace_usage",
      referenceType: "listing",
      referenceId: l.id,
      description: `Purchase: ${l.title}`,
      actorId: input.buyerId,
    });
    const { data, error } = await sb.from("listing_purchases").insert({
      ...base,
      credit_ledger_id: (consumed as { id?: string })?.id ?? null,
    } as never).select("*").single();
    if (error) throw error;
    await onPurchaseSettled(sb, l, input.buyerId, "credits");
    return { settled: true, purchase: data };
  }

  if (l.purchase_type === "wallet") {
    if (l.price_cents <= 0) throw new Error("invalid_wallet_price");
    // Debit buyer wallet
    const debit = await postLedgerEntry(sb, {
      wallet: { ownerType: "user", ownerId: input.buyerId, currency: l.currency },
      direction: "debit",
      amountCents: Number(l.price_cents),
      entryType: "consume",
      description: `Marketplace purchase: ${l.title}`,
      referenceType: "listing",
      referenceId: l.id,
      actorId: input.buyerId,
    });
    if (!debit.ok) throw new Error(`wallet_debit_failed: ${debit.reason ?? "unknown"}`);
    // Credit seller wallet
    await postLedgerEntry(sb, {
      wallet: { ownerType: "user", ownerId: l.seller_id, currency: l.currency },
      direction: "credit",
      amountCents: Number(l.price_cents),
      entryType: "marketplace_earning",
      description: `Marketplace sale: ${l.title}`,
      referenceType: "listing",
      referenceId: l.id,
      actorId: input.buyerId,
    });
    const { data, error } = await sb.from("listing_purchases").insert({
      ...base, wallet_ledger_id: debit.entryId ?? null,
    } as never).select("*").single();
    if (error) throw error;
    await onPurchaseSettled(sb, l, input.buyerId, "wallet");
    return { settled: true, purchase: data };
  }

  // one_time / subscription / enterprise — create a PENDING transaction.
  // Settlement is the payments webhook's responsibility. We do NOT create
  // an active entitlement until settlement lands.
  const { data: tx, error: txErr } = await sb.from("marketplace_transactions")
    .insert({
      listing_id: l.id,
      buyer_id: input.buyerId,
      seller_id: l.seller_id,
      amount_cents: l.price_cents,
      currency: l.currency,
      status: "pending" as never,
    } as never).select("*").single();
  if (txErr) throw txErr;
  await audit(sb, "listing.purchase_pending", l.id,
    { buyer: input.buyerId, txId: (tx as { id: string }).id, type: l.purchase_type });
  await notify(sb, input.buyerId, "purchase_pending",
    { listingId: l.id, title: l.title, txId: (tx as { id: string }).id });
  return { settled: false, pending: true, transaction: tx };
}

/**
 * Called by the payments webhook when a marketplace transaction becomes
 * SUCCEEDED. Creates the entitlement, atomically-ish. Idempotent by
 * `transaction_id`.
 */
export async function settlePendingPurchase(sb: SB, transactionId: string) {
  const { data: tx, error } = await sb.from("marketplace_transactions")
    .select("*").eq("id", transactionId).maybeSingle();
  if (error) throw error;
  if (!tx) throw new Error("transaction_not_found");
  const t = tx as {
    id: string; listing_id: string | null; buyer_id: string;
    seller_id: string; amount_cents: number; currency: string; status: string;
  };
  if (!t.listing_id) throw new Error("transaction_missing_listing");
  if (t.status !== "succeeded") throw new Error("transaction_not_succeeded");

  const existing = await sb.from("listing_purchases")
    .select("id").eq("transaction_id", t.id).maybeSingle();
  if (existing.data) return { alreadyOwned: true, purchaseId: (existing.data as { id: string }).id };

  const l = await loadListing(sb, t.listing_id);
  const { data, error: pErr } = await sb.from("listing_purchases").insert({
    listing_id: l.id,
    buyer_id: t.buyer_id,
    seller_id: t.seller_id,
    purchase_type: l.purchase_type,
    price_cents: t.amount_cents,
    price_credits: 0,
    currency: t.currency,
    version_at_purchase: l.current_version,
    transaction_id: t.id,
    status: "active",
  } as never).select("*").single();
  if (pErr) throw pErr;
  await onPurchaseSettled(sb, l, t.buyer_id, l.purchase_type);
  return { settled: true, purchase: data };
}

async function onPurchaseSettled(sb: SB, l: ListingRow, buyerId: string, kind: string) {
  await sb.from("listings").update({
    download_count: (l.download_count ?? 0) + 0, // download count increments on download
  } as never).eq("id", l.id);
  await audit(sb, "listing.purchased", l.id, { buyer: buyerId, kind });
  await notify(sb, buyerId, "purchase_complete",
    { listingId: l.id, title: l.title, kind });
  await notify(sb, l.seller_id, "sale_complete",
    { listingId: l.id, title: l.title, kind, buyerId });
}

export async function refundPurchase(sb: SB, purchaseId: string, actorId: string, reason: string) {
  const { data: p, error } = await sb.from("listing_purchases")
    .select("*").eq("id", purchaseId).maybeSingle();
  if (error) throw error;
  if (!p) throw new Error("purchase_not_found");
  const row = p as {
    id: string; buyer_id: string; seller_id: string; listing_id: string;
    status: string; purchase_type: string;
  };
  if (row.status !== "active") throw new Error("purchase_not_active");
  const { data, error: uErr } = await sb.from("listing_purchases").update({
    status: "refunded", refunded_at: new Date().toISOString(),
  } as never).eq("id", purchaseId).select("*").single();
  if (uErr) throw uErr;
  await audit(sb, "listing.refunded", row.listing_id,
    { purchaseId, reason, actorId });
  await notify(sb, row.buyer_id, "refund", { purchaseId, reason });
  await notify(sb, row.seller_id, "refund_issued", { purchaseId, reason });
  return data;
}

/* ------------------------------ download ---------------------------- */

export async function authorizeDownload(sb: SB, args: {
  listingId: string; buyerId: string;
  ipHash?: string | null; userAgent?: string | null;
}) {
  const l = await loadListing(sb, args.listingId);
  if (l.review_status !== "published") throw new Error("listing_not_available");

  // Owner (seller) can always download; ops admin path is via the server-fn layer.
  let purchaseId: string | null = null;
  if (l.seller_id !== args.buyerId) {
    const { data: p, error: pErr } = await sb.from("listing_purchases")
      .select("id, status").eq("listing_id", l.id).eq("buyer_id", args.buyerId)
      .eq("status", "active").maybeSingle();
    if (pErr) throw pErr;
    if (!p) throw new Error("no_active_entitlement");
    purchaseId = (p as { id: string }).id;
  }

  await sb.from("listing_downloads").insert({
    listing_id: l.id, purchase_id: purchaseId, buyer_id: args.buyerId,
    version: l.current_version, artifact_path: l.artifact_path,
    ip_hash: args.ipHash ?? null, user_agent: args.userAgent ?? null,
  } as never);
  await sb.from("listings").update({
    download_count: (l.download_count ?? 0) + 1,
  } as never).eq("id", l.id);

  return {
    listingId: l.id, version: l.current_version, artifactPath: l.artifact_path,
    // The download URL is issued by the storage layer; here we return the
    // logical path and let the caller mint a signed URL if the artifact
    // lives in Supabase Storage.
    signedUrl: null as string | null,
    note: l.artifact_path
      ? "artifact_path returned; caller must sign via storage"
      : "listing has no artifact bound yet",
  };
}

/* ------------------------------ reviews ----------------------------- */

export async function submitReview(sb: SB, args: {
  listingId: string; reviewerId: string; rating: number; body?: string;
}) {
  const rating = Math.max(1, Math.min(5, Math.floor(args.rating)));
  // Enforce: reviewer must have an active purchase.
  const { data: entitlement } = await sb.from("listing_purchases")
    .select("id").eq("listing_id", args.listingId)
    .eq("buyer_id", args.reviewerId).eq("status", "active").maybeSingle();
  if (!entitlement) throw new Error("review_requires_active_purchase");

  const { data, error } = await sb.from("listing_reviews")
    .upsert({
      listing_id: args.listingId,
      reviewer_id: args.reviewerId,
      rating, body: args.body ?? null,
    } as never, { onConflict: "listing_id,reviewer_id" })
    .select("*").single();
  if (error) throw error;

  // Recompute rating aggregate on the listing.
  const { data: rows } = await sb.from("listing_reviews")
    .select("rating").eq("listing_id", args.listingId);
  const arr = (rows ?? []) as Array<{ rating: number }>;
  const count = arr.length;
  const avg = count ? arr.reduce((a, b) => a + Number(b.rating), 0) / count : 0;
  await sb.from("listings").update({
    rating_avg: Number(avg.toFixed(2)),
    rating_count: count,
  } as never).eq("id", args.listingId);

  // Notify seller.
  const l = await loadListing(sb, args.listingId);
  await notify(sb, l.seller_id, "review_received",
    { listingId: l.id, title: l.title, rating, reviewerId: args.reviewerId });

  return data;
}

/* ------------------------------ wishlist ---------------------------- */

export async function toggleWishlist(sb: SB, listingId: string, userId: string) {
  const existing = await sb.from("listing_wishlist")
    .select("id").eq("listing_id", listingId).eq("user_id", userId).maybeSingle();
  if (existing.data) {
    await sb.from("listing_wishlist").delete()
      .eq("id", (existing.data as { id: string }).id);
    const { data: l } = await sb.from("listings").select("favorite_count").eq("id", listingId).maybeSingle();
    const c = Math.max(0, ((l as { favorite_count: number } | null)?.favorite_count ?? 0) - 1);
    await sb.from("listings").update({ favorite_count: c } as never).eq("id", listingId);
    return { favorited: false };
  }
  await sb.from("listing_wishlist").insert({
    listing_id: listingId, user_id: userId,
  } as never);
  const { data: l } = await sb.from("listings").select("favorite_count").eq("id", listingId).maybeSingle();
  const c = ((l as { favorite_count: number } | null)?.favorite_count ?? 0) + 1;
  await sb.from("listings").update({ favorite_count: c } as never).eq("id", listingId);
  return { favorited: true };
}

export async function listWishlist(sb: SB, userId: string) {
  const { data, error } = await sb.from("listing_wishlist")
    .select("id, created_at, listing:listings(*)")
    .eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ------------------------------ analytics --------------------------- */

export async function sellerAnalytics(sb: SB, sellerId: string) {
  const [{ data: listings }, { data: purchases }, { data: downloads }] = await Promise.all([
    sb.from("listings").select("id, title, download_count, rating_avg, rating_count, view_count, favorite_count")
      .eq("seller_id", sellerId),
    sb.from("listing_purchases").select("price_cents, price_credits, purchase_type, status, created_at")
      .eq("seller_id", sellerId),
    sb.from("listing_downloads").select("id, created_at, listing_id")
      .in("listing_id", ((await sb.from("listings").select("id").eq("seller_id", sellerId)).data ?? [])
        .map((r) => (r as { id: string }).id)),
  ]);
  const p = (purchases ?? []) as Array<{ price_cents: number; price_credits: number; status: string }>;
  const revenueCents = p.filter((r) => r.status === "active")
    .reduce((a, b) => a + Number(b.price_cents ?? 0), 0);
  const creditsEarned = p.filter((r) => r.status === "active")
    .reduce((a, b) => a + Number(b.price_credits ?? 0), 0);
  return {
    listings: (listings ?? []) as Array<Record<string, unknown>>,
    revenueCents,
    creditsEarned,
    purchaseCount: p.filter((r) => r.status === "active").length,
    refundCount: p.filter((r) => r.status === "refunded").length,
    downloadCount: (downloads ?? []).length,
  };
}

export async function marketplaceOverview(sb: SB) {
  const [{ data: listings }, { data: purchases }, { data: downloads }] = await Promise.all([
    sb.from("listings").select("id, title, seller_id, review_status, download_count, rating_avg, published_at, price_cents"),
    sb.from("listing_purchases").select("listing_id, price_cents, status, created_at"),
    sb.from("listing_downloads").select("id, created_at"),
  ]);
  const rows = (listings ?? []) as Array<{
    id: string; title: string; seller_id: string; review_status: string;
    download_count: number | null; rating_avg: number | null;
    published_at: string | null; price_cents: number;
  }>;
  const bucket: Record<string, number> = {
    draft: 0, pending_review: 0, approved: 0, published: 0,
    hidden: 0, rejected: 0, archived: 0,
  };
  for (const r of rows) bucket[r.review_status] = (bucket[r.review_status] ?? 0) + 1;

  const p = (purchases ?? []) as Array<{ listing_id: string; price_cents: number; status: string }>;
  const grossCents = p.filter((r) => r.status === "active")
    .reduce((a, b) => a + Number(b.price_cents ?? 0), 0);
  const purchaseCount = p.filter((r) => r.status === "active").length;

  // Top sellers by total downloads
  const topByDownloads = [...rows]
    .filter((r) => r.review_status === "published")
    .sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
    .slice(0, 10);

  return {
    counts: { total: rows.length, ...bucket },
    grossCents,
    purchaseCount,
    downloadCount: (downloads ?? []).length,
    topByDownloads,
    supportedAssetTypes: ASSET_TYPES,
    supportedPurchaseTypes: PURCHASE_TYPES,
  };
}

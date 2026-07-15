/**
 * R37 — Enterprise Ecosystem Runtime (server-only)
 *
 * Extends the existing marketplace runtime (src/lib/marketplace) with:
 *   - Store taxonomy (categories)
 *   - Curated collections + featured slots
 *   - Compatibility matrix per listing version
 *   - Cached recommendations (fact vs ai — never mixed)
 *   - Creator profiles, payouts, support tickets
 *   - Immutable store_events audit trail
 *
 * REUSES (never duplicates):
 *   - listings / listing_versions / listing_reviews / listing_purchases /
 *     listing_downloads / listing_wishlist
 *   - marketplace_transactions, wallet_ledger_entries, credit_ledger_entries
 *   - notifications, follows, audit_logs
 *   - plugin_installations (bridge for category=plugins)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

/* ------------------------------ types ------------------------------- */

export type StoreCategoryCode =
  | "applications" | "templates" | "plugins" | "widgets" | "themes"
  | "ai_agents" | "business_packs" | "industry_packs" | "prompt_packs"
  | "knowledge_packs" | "courses" | "learning_packs"
  | "digital_human_assets" | "voice_packs" | "animation_packs"
  | "3d_assets" | "developer_tools" | "presentation_packs" | "whiteboard_packs";

export type CollectionKind =
  | "manual" | "trending" | "recently_updated" | "top_rated" | "founder_picks";

export type RecommendationKind = "fact" | "ai";

export interface EcosystemOverview {
  facts: {
    totalListings: number;
    publishedListings: number;
    activeCreators: number;
    verifiedCreators: number;
    totalDownloads: number;
    totalPurchases: number;
    grossRevenueCents: number;
    categoriesActive: number;
    collectionsActive: number;
    featuredNow: number;
    supportOpen: number;
    supportResolvedLast30d: number;
  };
  recommendations: string[];
}

/* ------------------------------ helpers ----------------------------- */

async function audit(
  sb: SB, action: string, listingId: string | null, meta: Record<string, unknown>,
) {
  try {
    await sb.rpc("write_audit", {
      _category: "ecosystem",
      _action: action,
      _entity_type: listingId ? "listings" : "ecosystem",
      _entity_id: listingId ?? undefined,
      _metadata: meta as never,
    } as never);
  } catch { /* best effort */ }
}

async function emit(
  sb: SB, event_type: string, listing_id: string | null,
  actor_id: string | null, payload: Record<string, unknown>,
) {
  try {
    await sb.from("store_events").insert({
      event_type, listing_id, actor_id, payload: payload as never,
    } as never);
  } catch { /* best effort */ }
}

async function assertOpsAdmin(sb: SB, userId: string): Promise<void> {
  const { data, error } = await sb.rpc("is_ops_admin", { _user_id: userId });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: ops admin required");
}

async function assertListingOwner(sb: SB, listingId: string, userId: string): Promise<void> {
  const { data, error } = await sb.from("listings")
    .select("seller_id").eq("id", listingId).maybeSingle();
  if (error) throw new Error(`db_read_failed: ${error.message}`);
  if (!data) throw new Error("listing_not_found");
  if ((data as { seller_id: string }).seller_id === userId) return;
  const { data: ops } = await sb.rpc("is_ops_admin", { _user_id: userId });
  if (!ops) throw new Error("Forbidden: not listing owner");
}

/* ------------------------------ categories -------------------------- */

export interface CategoryUpsert {
  code: string;
  label: string;
  description?: string | null;
  parent_id?: string | null;
  icon?: string | null;
  sort_order?: number;
  active?: boolean;
}

export async function listCategories(sb: SB) {
  const { data, error } = await sb.from("store_categories")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertCategory(sb: SB, userId: string, input: CategoryUpsert) {
  await assertOpsAdmin(sb, userId);
  const { data, error } = await sb.from("store_categories")
    .upsert({
      code: input.code,
      label: input.label,
      description: input.description ?? null,
      parent_id: input.parent_id ?? null,
      icon: input.icon ?? null,
      sort_order: input.sort_order ?? 0,
      active: input.active ?? true,
    } as never, { onConflict: "code" })
    .select().single();
  if (error) throw error;
  await audit(sb, "category.upsert", null, { code: input.code });
  return data;
}

export async function deactivateCategory(sb: SB, userId: string, code: string) {
  await assertOpsAdmin(sb, userId);
  const { error } = await sb.from("store_categories")
    .update({ active: false } as never)
    .eq("code", code);
  if (error) throw error;
  await audit(sb, "category.deactivate", null, { code });
  return { ok: true };
}

/* ------------------------------ collections ------------------------- */

export interface CollectionUpsert {
  code: string;
  title: string;
  description?: string | null;
  kind?: CollectionKind;
  active?: boolean;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

export async function listCollections(sb: SB, opts?: { includeInactive?: boolean }) {
  let q = sb.from("store_collections").select("*")
    .order("sort_order", { ascending: true });
  if (!opts?.includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getCollectionWithItems(sb: SB, code: string, limit = 24) {
  const { data: coll, error: cErr } = await sb.from("store_collections")
    .select("*").eq("code", code).maybeSingle();
  if (cErr) throw cErr;
  if (!coll) return null;

  // For algorithmic collections we compute live; for manual we read pinned items.
  const kind = (coll as { kind: CollectionKind }).kind;
  let listings: unknown[] = [];
  if (kind === "manual" || kind === "founder_picks") {
    const { data, error } = await sb.from("store_collection_items")
      .select("position, pinned_at, listing:listings(*)")
      .eq("collection_id", (coll as { id: string }).id)
      .order("position", { ascending: true })
      .limit(limit);
    if (error) throw error;
    listings = (data ?? []).map((r) => (r as { listing: unknown }).listing).filter(Boolean);
  } else if (kind === "top_rated") {
    const { data, error } = await sb.from("listings")
      .select("*")
      .eq("status", "active")
      .order("rating_avg", { ascending: false })
      .order("rating_count", { ascending: false })
      .limit(limit);
    if (error) throw error;
    listings = data ?? [];
  } else if (kind === "recently_updated") {
    const { data, error } = await sb.from("listings")
      .select("*")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    listings = data ?? [];
  } else if (kind === "trending") {
    // Trending = most downloads in last 7 days.
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await sb.from("listing_downloads")
      .select("listing_id")
      .gte("created_at", since);
    if (error) throw error;
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as { listing_id: string }[]) {
      counts.set(row.listing_id, (counts.get(row.listing_id) ?? 0) + 1);
    }
    const topIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
    if (topIds.length) {
      const { data: ls, error: lErr } = await sb.from("listings")
        .select("*").in("id", topIds);
      if (lErr) throw lErr;
      const byId = new Map<string, unknown>();
      for (const l of (ls ?? []) as { id: string }[]) byId.set(l.id, l);
      listings = topIds.map((id) => byId.get(id)).filter(Boolean);
    }
  }

  return { collection: coll, listings };
}

export async function upsertCollection(sb: SB, userId: string, input: CollectionUpsert) {
  await assertOpsAdmin(sb, userId);
  const { data, error } = await sb.from("store_collections")
    .upsert({
      code: input.code,
      title: input.title,
      description: input.description ?? null,
      kind: input.kind ?? "manual",
      active: input.active ?? true,
      sort_order: input.sort_order ?? 0,
      curator_id: userId,
      metadata: (input.metadata ?? {}) as never,
    } as never, { onConflict: "code" })
    .select().single();
  if (error) throw error;
  await audit(sb, "collection.upsert", null, { code: input.code });
  return data;
}

export async function pinToCollection(
  sb: SB, userId: string,
  code: string, listingId: string, position = 0,
) {
  await assertOpsAdmin(sb, userId);
  const { data: coll, error: cErr } = await sb.from("store_collections")
    .select("id").eq("code", code).maybeSingle();
  if (cErr) throw cErr;
  if (!coll) throw new Error("collection_not_found");
  const collectionId = (coll as { id: string }).id;

  const { error } = await sb.from("store_collection_items")
    .upsert({
      collection_id: collectionId, listing_id: listingId,
      position, pinned_by: userId,
    } as never, { onConflict: "collection_id,listing_id" });
  if (error) throw error;
  await audit(sb, "collection.pin", listingId, { collection: code, position });
  await emit(sb, "collection.pinned", listingId, userId, { collection: code });
  return { ok: true };
}

export async function unpinFromCollection(
  sb: SB, userId: string, code: string, listingId: string,
) {
  await assertOpsAdmin(sb, userId);
  const { data: coll, error: cErr } = await sb.from("store_collections")
    .select("id").eq("code", code).maybeSingle();
  if (cErr) throw cErr;
  if (!coll) throw new Error("collection_not_found");
  const collectionId = (coll as { id: string }).id;

  const { error } = await sb.from("store_collection_items").delete()
    .eq("collection_id", collectionId).eq("listing_id", listingId);
  if (error) throw error;
  await audit(sb, "collection.unpin", listingId, { collection: code });
  return { ok: true };
}

/* ------------------------------ featured ---------------------------- */

export interface FeatureInput {
  slotCode: string;
  listingId: string;
  startsAt?: string;
  endsAt?: string | null;
  weight?: number;
}

export async function listFeatured(sb: SB, slotCode?: string) {
  let q = sb.from("store_featured_slots")
    .select("*, listing:listings(*)")
    .lte("starts_at", new Date().toISOString());
  if (slotCode) q = q.eq("slot_code", slotCode);
  const { data, error } = await q.order("weight", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).filter((r) => {
    const ends = (r as { ends_at: string | null }).ends_at;
    return !ends || new Date(ends) > new Date();
  });
}

export async function featureListing(sb: SB, userId: string, input: FeatureInput) {
  await assertOpsAdmin(sb, userId);
  const { data, error } = await sb.from("store_featured_slots").insert({
    slot_code: input.slotCode,
    listing_id: input.listingId,
    starts_at: input.startsAt ?? new Date().toISOString(),
    ends_at: input.endsAt ?? null,
    weight: input.weight ?? 100,
    created_by: userId,
  } as never).select().single();
  if (error) throw error;
  await audit(sb, "featured.add", input.listingId, { slot: input.slotCode });
  await emit(sb, "featured.added", input.listingId, userId, { slot: input.slotCode });
  return data;
}

export async function unfeatureSlot(sb: SB, userId: string, slotId: string) {
  await assertOpsAdmin(sb, userId);
  const { data: row } = await sb.from("store_featured_slots")
    .select("listing_id, slot_code").eq("id", slotId).maybeSingle();
  const { error } = await sb.from("store_featured_slots").delete().eq("id", slotId);
  if (error) throw error;
  await audit(sb, "featured.remove", (row as { listing_id: string } | null)?.listing_id ?? null, {
    slot: (row as { slot_code: string } | null)?.slot_code,
  });
  return { ok: true };
}

/* ------------------------------ compatibility ----------------------- */

export interface CompatibilityInput {
  listingId: string;
  listingVersion: number;
  platformMin?: string | null;
  platformMax?: string | null;
  requires?: Array<{ code: string; version?: string }>;
  conflicts?: Array<{ code: string; reason?: string }>;
  notes?: string | null;
}

export async function setCompatibility(sb: SB, userId: string, input: CompatibilityInput) {
  await assertListingOwner(sb, input.listingId, userId);
  const { data, error } = await sb.from("store_compatibility")
    .upsert({
      listing_id: input.listingId,
      listing_version: input.listingVersion,
      platform_min: input.platformMin ?? null,
      platform_max: input.platformMax ?? null,
      requires: (input.requires ?? []) as never,
      conflicts: (input.conflicts ?? []) as never,
      notes: input.notes ?? null,
      created_by: userId,
    } as never, { onConflict: "listing_id,listing_version" })
    .select().single();
  if (error) throw error;
  await audit(sb, "compatibility.set", input.listingId, { version: input.listingVersion });
  return data;
}

export async function checkCompatibility(
  sb: SB,
  input: { listingId: string; listingVersion: number; platformVersion?: string },
): Promise<{ compatible: boolean; reasons: string[] }> {
  const { data, error } = await sb.from("store_compatibility")
    .select("*")
    .eq("listing_id", input.listingId)
    .eq("listing_version", input.listingVersion)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { compatible: true, reasons: ["no_matrix_declared"] };

  const row = data as unknown as {
    platform_min: string | null; platform_max: string | null;
    requires: Array<{ code: string; version?: string }>;
    conflicts: Array<{ code: string; reason?: string }>;
  };
  const reasons: string[] = [];
  const pv = input.platformVersion;
  if (pv && row.platform_min && compareSemver(pv, row.platform_min) < 0) {
    reasons.push(`platform_below_min:${row.platform_min}`);
  }
  if (pv && row.platform_max && compareSemver(pv, row.platform_max) > 0) {
    reasons.push(`platform_above_max:${row.platform_max}`);
  }
  return { compatible: reasons.length === 0, reasons };
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/* ------------------------------ recommendations --------------------- */

/**
 * Compute a "fact" recommendation set: purely aggregate from real signals.
 * Never call an LLM here — kind='fact' only.
 */
export async function computeFactRecommendations(
  sb: SB, userId: string,
  scope: "global" | "user" = "global",
  limit = 12,
): Promise<{ id: string; listing_ids: string[]; evidence: Record<string, unknown> }> {
  await assertOpsAdmin(sb, userId);
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  // Rank by (downloads_30d * 3) + (rating_avg * 10 * rating_count) with a
  // small recency bump. This is deterministic and fully explainable.
  const [{ data: downloads, error: dlErr }, { data: listings, error: lErr }] = await Promise.all([
    sb.from("listing_downloads").select("listing_id").gte("created_at", since),
    sb.from("listings").select("id, title, rating_avg, rating_count, updated_at, status")
      .eq("status", "active"),
  ]);
  if (dlErr) throw dlErr;
  if (lErr) throw lErr;

  const dlCount = new Map<string, number>();
  for (const r of (downloads ?? []) as { listing_id: string }[]) {
    dlCount.set(r.listing_id, (dlCount.get(r.listing_id) ?? 0) + 1);
  }
  const now = Date.now();
  const scored = ((listings ?? []) as {
    id: string; title: string; rating_avg: number;
    rating_count: number; updated_at: string;
  }[]).map((l) => {
    const dl = dlCount.get(l.id) ?? 0;
    const ageDays = Math.max(1, (now - new Date(l.updated_at).getTime()) / 86400000);
    const score = dl * 3 + l.rating_avg * 10 * l.rating_count + 20 / ageDays;
    return { id: l.id, score, dl, ratingAvg: l.rating_avg, ratingCount: l.rating_count };
  }).sort((a, b) => b.score - a.score).slice(0, limit);

  const listing_ids = scored.map((s) => s.id);
  const evidence = {
    algorithm: "fact_score_v1",
    formula: "downloads_30d*3 + rating_avg*10*rating_count + 20/age_days",
    window: "30d",
    scored: scored.slice(0, limit),
  };

  const { data, error } = await sb.from("store_recommendations").insert({
    kind: "fact",
    source: "ecosystem.engine",
    subject_user_id: scope === "user" ? userId : null,
    scope,
    listing_ids: listing_ids as never,
    evidence: evidence as never,
    expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
  } as never).select("id, listing_ids, evidence").single();
  if (error) throw error;
  return data as { id: string; listing_ids: string[]; evidence: Record<string, unknown> };
}

export async function getLatestFactRecommendations(sb: SB, limit = 12) {
  const { data, error } = await sb.from("store_recommendations")
    .select("*")
    .eq("kind", "fact").is("subject_user_id", null)
    .order("generated_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = (data ?? [])[0] as { listing_ids: string[]; evidence: unknown } | undefined;
  if (!row) return { listing_ids: [], evidence: {}, listings: [] };
  const ids = (row.listing_ids ?? []).slice(0, limit);
  if (!ids.length) return { listing_ids: [], evidence: row.evidence, listings: [] };
  const { data: ls } = await sb.from("listings").select("*").in("id", ids);
  const byId = new Map<string, unknown>();
  for (const l of (ls ?? []) as { id: string }[]) byId.set(l.id, l);
  return {
    listing_ids: ids,
    evidence: row.evidence,
    listings: ids.map((id) => byId.get(id)).filter(Boolean),
  };
}

/* ------------------------------ creators ---------------------------- */

export interface CreatorProfileInput {
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  payout_currency?: string;
  payout_method?: Record<string, unknown>;
}

export async function upsertCreatorProfile(sb: SB, userId: string, input: CreatorProfileInput) {
  const payload = {
    user_id: userId,
    display_name: input.display_name,
    bio: input.bio ?? null,
    avatar_url: input.avatar_url ?? null,
    website: input.website ?? null,
    payout_currency: input.payout_currency ?? "usd",
    payout_method: (input.payout_method ?? {}) as never,
  };
  const { data, error } = await sb.from("creator_profiles")
    .upsert(payload as never, { onConflict: "user_id" })
    .select().single();
  if (error) throw error;
  await audit(sb, "creator_profile.upsert", null, { user_id: userId });
  return data;
}

export async function getCreatorProfile(sb: SB, userId: string) {
  const { data, error } = await sb.from("creator_profiles")
    .select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function verifyCreator(
  sb: SB, opsUserId: string, creatorUserId: string, verified: boolean,
) {
  await assertOpsAdmin(sb, opsUserId);
  const { data, error } = await sb.from("creator_profiles")
    .update({
      verified,
      verified_at: verified ? new Date().toISOString() : null,
      verified_by: verified ? opsUserId : null,
    } as never)
    .eq("user_id", creatorUserId).select().single();
  if (error) throw error;
  await audit(sb, "creator.verify", null, { user_id: creatorUserId, verified });
  return data;
}

export async function creatorDashboard(sb: SB, userId: string) {
  const [profile, listings, purchases, payouts, tickets] = await Promise.all([
    sb.from("creator_profiles").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("listings").select("id, title, status, rating_avg, rating_count, download_count, view_count, updated_at")
      .eq("seller_id", userId).is("deleted_at", null),
    sb.from("listing_purchases").select("price_cents, status, created_at")
      .eq("seller_id", userId),
    sb.from("creator_payouts").select("*").eq("creator_id", userId)
      .order("initiated_at", { ascending: false }).limit(20),
    sb.from("creator_support_tickets").select("*").eq("creator_id", userId)
      .order("last_message_at", { ascending: false }).limit(20),
  ]);

  const purchaseRows = (purchases.data ?? []) as { price_cents: number; status: string }[];
  const settled = purchaseRows.filter((p) => p.status === "settled");
  const listingRows = (listings.data ?? []) as {
    download_count: number | null; view_count: number | null;
  }[];

  return {
    profile: profile.data ?? null,
    stats: {
      totalListings: listingRows.length,
      totalDownloads: listingRows.reduce((s, l) => s + (l.download_count ?? 0), 0),
      totalViews: listingRows.reduce((s, l) => s + (l.view_count ?? 0), 0),
      totalPurchases: purchaseRows.length,
      settledPurchases: settled.length,
      grossRevenueCents: settled.reduce((s, p) => s + (p.price_cents ?? 0), 0),
    },
    listings: listings.data ?? [],
    payouts: payouts.data ?? [],
    supportTickets: tickets.data ?? [],
  };
}

/* ------------------------------ payouts ----------------------------- */

export interface PayoutInput {
  amountCents: number;
  currency?: string;
  method: string;
  reference?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Records a payout request. Actual wallet/rail transfer happens in a
 * separate provider webhook — this row is transitioned to 'settled' only
 * when that evidence lands. We never claim settled without evidence.
 */
export async function requestPayout(sb: SB, userId: string, input: PayoutInput) {
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    throw new Error("amount_invalid");
  }
  const { data, error } = await sb.from("creator_payouts").insert({
    creator_id: userId,
    amount_cents: input.amountCents,
    currency: (input.currency ?? "usd").toLowerCase(),
    method: input.method,
    status: "pending",
    reference: input.reference ?? null,
    metadata: (input.metadata ?? {}) as never,
  } as never).select().single();
  if (error) throw error;
  await audit(sb, "payout.request", null, { amount: input.amountCents });
  return data;
}

export async function markPayoutSettled(
  sb: SB, opsUserId: string,
  payoutId: string, walletLedgerId: string | null, reference?: string,
) {
  await assertOpsAdmin(sb, opsUserId);
  const { data, error } = await sb.from("creator_payouts")
    .update({
      status: "settled",
      settled_at: new Date().toISOString(),
      wallet_ledger_id: walletLedgerId,
      reference: reference ?? null,
    } as never)
    .eq("id", payoutId).select().single();
  if (error) throw error;
  await audit(sb, "payout.settled", null, { payout_id: payoutId });
  return data;
}

/* ------------------------------ support ----------------------------- */

export interface SupportTicketInput {
  creatorId: string;
  listingId?: string | null;
  subject: string;
  body: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export async function openSupportTicket(sb: SB, buyerId: string, input: SupportTicketInput) {
  if (!input.subject.trim() || !input.body.trim()) throw new Error("subject_and_body_required");
  const { data, error } = await sb.from("creator_support_tickets").insert({
    creator_id: input.creatorId,
    buyer_id: buyerId,
    listing_id: input.listingId ?? null,
    subject: input.subject.trim().slice(0, 200),
    body: input.body.trim().slice(0, 4000),
    priority: input.priority ?? "normal",
  } as never).select().single();
  if (error) throw error;
  await audit(sb, "support.open", input.listingId ?? null, { creator: input.creatorId });
  return data;
}

export async function updateSupportTicket(
  sb: SB, userId: string, ticketId: string,
  patch: { status?: string; priority?: string; body?: string },
) {
  const upd: Record<string, unknown> = { last_message_at: new Date().toISOString() };
  if (patch.status) {
    upd.status = patch.status;
    if (patch.status === "resolved" || patch.status === "closed") {
      upd.resolved_at = new Date().toISOString();
    }
  }
  if (patch.priority) upd.priority = patch.priority;
  const { data, error } = await sb.from("creator_support_tickets")
    .update(upd as never).eq("id", ticketId).select().single();
  if (error) throw error;
  await audit(sb, "support.update", null, { ticket_id: ticketId, patch });
  await emit(sb, "support.updated", null, userId, { ticket_id: ticketId, patch });
  return data;
}

/* ------------------------------ founder overview -------------------- */

export async function ecosystemOverview(sb: SB, userId: string): Promise<EcosystemOverview> {
  await assertOpsAdmin(sb, userId);
  const nowIso = new Date().toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [
    listingsTotal, listingsPublished, creatorsActive, creatorsVerified,
    downloadsCount, purchasesCount, revenue, cats, colls, featured, supportOpen, supportResolved,
  ] = await Promise.all([
    sb.from("listings").select("id", { count: "exact", head: true }),
    sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    sb.from("creator_profiles").select("user_id", { count: "exact", head: true }).eq("status", "active"),
    sb.from("creator_profiles").select("user_id", { count: "exact", head: true }).eq("verified", true),
    sb.from("listing_downloads").select("id", { count: "exact", head: true }),
    sb.from("listing_purchases").select("id", { count: "exact", head: true }),
    sb.from("listing_purchases").select("price_cents").eq("status", "settled"),
    sb.from("store_categories").select("id", { count: "exact", head: true }).eq("active", true),
    sb.from("store_collections").select("id", { count: "exact", head: true }).eq("active", true),
    sb.from("store_featured_slots").select("id", { count: "exact", head: true })
      .lte("starts_at", nowIso),
    sb.from("creator_support_tickets").select("id", { count: "exact", head: true })
      .in("status", ["open", "pending_creator", "pending_buyer"]),
    sb.from("creator_support_tickets").select("id", { count: "exact", head: true })
      .eq("status", "resolved").gte("resolved_at", monthAgo),
  ]);

  const revenueRows = (revenue.data ?? []) as { price_cents: number }[];
  const gross = revenueRows.reduce((s, r) => s + (r.price_cents ?? 0), 0);

  const facts = {
    totalListings: listingsTotal.count ?? 0,
    publishedListings: listingsPublished.count ?? 0,
    activeCreators: creatorsActive.count ?? 0,
    verifiedCreators: creatorsVerified.count ?? 0,
    totalDownloads: downloadsCount.count ?? 0,
    totalPurchases: purchasesCount.count ?? 0,
    grossRevenueCents: gross,
    categoriesActive: cats.count ?? 0,
    collectionsActive: colls.count ?? 0,
    featuredNow: featured.count ?? 0,
    supportOpen: supportOpen.count ?? 0,
    supportResolvedLast30d: supportResolved.count ?? 0,
  };

  const recommendations: string[] = [];
  if (facts.publishedListings === 0) recommendations.push("No published listings yet — invite creators to publish.");
  if (facts.verifiedCreators / Math.max(1, facts.activeCreators) < 0.1) {
    recommendations.push("Less than 10% of creators are verified — review the verification queue.");
  }
  if (facts.featuredNow === 0) recommendations.push("No active Featured slots — curate at least one Featured item.");
  if (facts.supportOpen > 20) recommendations.push("Support backlog is high — assign moderators.");

  return { facts, recommendations };
}

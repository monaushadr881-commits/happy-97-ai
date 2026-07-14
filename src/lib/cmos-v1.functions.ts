/**
 * HAPPY X — Community, Marketplace & Commerce OS (CMOS) API v1
 *
 * Governance:
 *   - Every mutation runs through `requireSupabaseAuth`; RLS enforces ownership.
 *   - Every user owns their content, every creator their projects, every seller
 *     their catalog. Businesses only see their tenant rows via existing RLS.
 *   - All AI calls go through the Lovable AI Gateway (see creator-v1 / edu-v1).
 *   - Marketplace transactions are auditable via `marketplace_transactions`.
 *
 * Tables reused (schema pre-existing, no new migration):
 *   posts, comments, reactions, follows, groups, group_memberships,
 *   listings, listing_reviews, marketplace_transactions,
 *   conversations, messages, notifications.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError } from "@/services/core/errors";
import { z } from "zod";

const uuid = z.string().uuid();
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

// =====================================================================
// COMMUNITY — Posts, Comments, Reactions, Follows, Groups
// =====================================================================

export const communityFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      scope: z.enum(["public", "following", "mine", "group"]).default("public"),
      group_id: uuid.optional(),
      limit: z.number().int().min(1).max(50).default(20),
      cursor: z.string().datetime().optional(),
    }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase
      .from("posts")
      .select("id, author_id, group_id, title, body, media, visibility, reply_count, reaction_count, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.cursor) q = q.lt("created_at", data.cursor);
    if (data.scope === "mine") q = q.eq("author_id", context.userId);
    else if (data.scope === "group" && data.group_id) q = q.eq("group_id", data.group_id);
    else if (data.scope === "following") {
      const f = await context.supabase.from("follows").select("followee_id").eq("follower_id", context.userId);
      const ids = (f.data ?? []).map((r) => r.followee_id);
      if (ids.length === 0) return { items: [], next_cursor: null as string | null };
      q = q.in("author_id", ids);
    }
    const r = await q;
    if (r.error) throw r.error;
    const items = r.data ?? [];
    return { items, next_cursor: items.length === data.limit ? items[items.length - 1].created_at : null };
  }));

const CreatePost = z.object({
  title: z.string().max(240).optional(),
  body: z.string().min(1).max(20000),
  group_id: uuid.nullable().optional(),
  visibility: z.enum(["public", "private", "unlisted"]).default("public"),
  media: z.array(z.object({ url: z.string().url(), kind: z.string() })).max(10).default([]),
});
export const communityCreatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreatePost.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("posts")
      .insert({ ...data, author_id: context.userId, created_by: context.userId })
      .select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const communityDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("posts")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", data.id).eq("author_id", context.userId);
    if (r.error) throw r.error;
    return { ok: true };
  }));

export const communityListComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ post_id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("comments")
      .select("id, post_id, parent_id, author_id, body, reaction_count, created_at")
      .eq("post_id", data.post_id).eq("status", "active")
      .order("created_at", { ascending: true }).limit(200);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const communityAddComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    post_id: uuid, parent_id: uuid.optional(), body: z.string().min(1).max(4000),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("comments")
      .insert({ ...data, author_id: context.userId }).select("*").single();
    if (r.error) throw r.error;
    try {
      await context.supabase.rpc("write_audit", {
        _category: "community", _action: "comment.create",
        _entity_type: "post", _entity_id: data.post_id,
      });
    } catch { /* audit is best-effort */ }
    return r.data;
  }));

export const communityReact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    target_type: z.enum(["post", "comment", "listing"]),
    target_id: uuid,
    kind: z.enum(["like", "love", "insightful", "celebrate", "curious"]).default("like"),
    on: z.boolean().default(true),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    if (data.on) {
      await context.supabase.from("reactions").upsert(
        { user_id: context.userId, target_type: data.target_type, target_id: data.target_id, kind: data.kind },
        { onConflict: "user_id,target_type,target_id,kind" },
      );
    } else {
      await context.supabase.from("reactions").delete()
        .eq("user_id", context.userId)
        .eq("target_type", data.target_type)
        .eq("target_id", data.target_id)
        .eq("kind", data.kind);
    }
    return { ok: true };
  }));

export const communityFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ user_id: uuid, on: z.boolean().default(true) }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    if (data.user_id === context.userId) throw new Error("Cannot follow yourself.");
    if (data.on) {
      await context.supabase.from("follows")
        .upsert({ follower_id: context.userId, followee_id: data.user_id },
          { onConflict: "follower_id,followee_id" });
    } else {
      await context.supabase.from("follows").delete()
        .eq("follower_id", context.userId).eq("followee_id", data.user_id);
    }
    return { ok: true };
  }));

export const communityListGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("groups")
      .select("id, slug, name, description, cover_url, visibility, owner_id, created_at")
      .eq("status", "active").order("created_at", { ascending: false }).limit(50);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

// =====================================================================
// MARKETPLACE — Listings, Reviews
// =====================================================================

export const marketBrowse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    q: z.string().max(120).optional(),
    category: z.string().max(60).optional(),
    limit: z.number().int().min(1).max(48).default(24),
  }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("listings")
      .select("id, slug, seller_id, title, description, price_cents, currency, cover_url, category, rating_avg, rating_count, created_at")
      .eq("status", "active").order("created_at", { ascending: false }).limit(data.limit);
    if (data.category) q = q.eq("category", data.category);
    if (data.q) q = q.ilike("title", `%${data.q}%`);
    const r = await q;
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const marketGetListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const l = await context.supabase.from("listings").select("*").eq("id", data.id).maybeSingle();
    if (l.error) throw l.error;
    const rev = await context.supabase.from("listing_reviews")
      .select("id, reviewer_id, rating, body, created_at")
      .eq("listing_id", data.id).order("created_at", { ascending: false }).limit(50);
    return { listing: l.data, reviews: rev.data ?? [] };
  }));

const CreateListing = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(20000).optional(),
  price_cents: z.number().int().min(0),
  currency: z.string().length(3).default("USD"),
  cover_url: z.string().url().optional(),
  category: z.string().max(60).optional(),
  status: z.enum(["draft", "active"]).default("draft"),
});
export const marketCreateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateListing.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}-${Date.now().toString(36)}`;
    const r = await context.supabase.from("listings").insert({
      ...data, slug, seller_id: context.userId, created_by: context.userId,
    }).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const marketUpdateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: uuid, patch: CreateListing.partial(),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("listings")
      .update({ ...data.patch, updated_by: context.userId })
      .eq("id", data.id).eq("seller_id", context.userId).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const marketMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("listings")
      .select("id, slug, title, price_cents, currency, status, rating_avg, rating_count, updated_at")
      .eq("seller_id", context.userId).order("updated_at", { ascending: false });
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const marketAddReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    listing_id: uuid, rating: z.number().int().min(1).max(5), body: z.string().max(4000).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("listing_reviews").upsert(
      { ...data, reviewer_id: context.userId },
      { onConflict: "listing_id,reviewer_id" },
    ).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// COMMERCE — Purchase intents & auditable transactions
// =====================================================================

export const commercePurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    listing_id: uuid,
    provider: z.enum(["mock", "stripe", "paddle", "razorpay"]).default("mock"),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const l = await context.supabase.from("listings")
      .select("id, seller_id, price_cents, currency, status").eq("id", data.listing_id).single();
    if (l.error || !l.data) throw new Error("Listing not found");
    if (l.data.status !== "active") throw new Error("Listing is not available");
    if (l.data.seller_id === context.userId) throw new Error("You cannot buy your own listing");
    const t = await context.supabase.from("marketplace_transactions").insert({
      listing_id: data.listing_id,
      buyer_id: context.userId,
      seller_id: l.data.seller_id,
      amount_cents: l.data.price_cents,
      currency: l.data.currency,
      provider: data.provider,
      status: "pending",
    }).select("*").single();
    if (t.error) throw t.error;
    await context.supabase.rpc("write_audit", {
      _category: "commerce", _action: "purchase.intent",
      _entity_type: "marketplace_transaction", _entity_id: t.data.id,
      _metadata: { listing_id: data.listing_id, provider: data.provider } as any,
    }).catch(() => {});
    return t.data;
  }));

export const commerceMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("marketplace_transactions")
      .select("id, listing_id, seller_id, amount_cents, currency, status, provider, created_at")
      .eq("buyer_id", context.userId).order("created_at", { ascending: false }).limit(100);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const commerceMySales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("marketplace_transactions")
      .select("id, listing_id, buyer_id, amount_cents, currency, status, provider, created_at")
      .eq("seller_id", context.userId).order("created_at", { ascending: false }).limit(100);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const commerceSellerStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const [listings, sales] = await Promise.all([
      context.supabase.from("listings").select("id,status", { count: "exact", head: false })
        .eq("seller_id", context.userId),
      context.supabase.from("marketplace_transactions").select("amount_cents,status")
        .eq("seller_id", context.userId),
    ]);
    const active = (listings.data ?? []).filter((l) => l.status === "active").length;
    const gross = (sales.data ?? [])
      .filter((s) => s.status === "succeeded" || s.status === "paid")
      .reduce((n, s) => n + Number(s.amount_cents ?? 0), 0);
    const pending = (sales.data ?? []).filter((s) => s.status === "pending").length;
    return {
      total_listings: listings.data?.length ?? 0,
      active_listings: active,
      gross_cents: gross,
      pending_orders: pending,
      total_orders: sales.data?.length ?? 0,
    };
  }));

// =====================================================================
// MESSAGING — reuses conversations/messages (user-owned threads)
// =====================================================================

export const msgListConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("conversations")
      .select("id, title, updated_at, created_at")
      .eq("user_id", context.userId).order("updated_at", { ascending: false }).limit(100);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const msgCreateConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ title: z.string().min(1).max(200) }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("conversations")
      .insert({ user_id: context.userId, title: data.title }).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const msgListMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ conversation_id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", data.conversation_id).eq("user_id", context.userId)
      .order("created_at", { ascending: true }).limit(500);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const msgSend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    conversation_id: uuid, content: z.string().min(1).max(8000),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("messages").insert({
      conversation_id: data.conversation_id,
      user_id: context.userId, role: "user", content: data.content,
    }).select("*").single();
    if (r.error) throw r.error;
    await context.supabase.from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.conversation_id).eq("user_id", context.userId);
    return r.data;
  }));

// =====================================================================
// CMOS DASHBOARD KPIs
// =====================================================================

export const cmosDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const uid = context.userId;
    const [posts, followers, listings, orders, sales] = await Promise.all([
      context.supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", uid).eq("status", "active"),
      context.supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", uid),
      context.supabase.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", uid),
      context.supabase.from("marketplace_transactions").select("id", { count: "exact", head: true }).eq("buyer_id", uid),
      context.supabase.from("marketplace_transactions").select("id", { count: "exact", head: true }).eq("seller_id", uid),
    ]);
    return {
      posts: posts.count ?? 0,
      followers: followers.count ?? 0,
      listings: listings.count ?? 0,
      orders: orders.count ?? 0,
      sales: sales.count ?? 0,
    };
  }));

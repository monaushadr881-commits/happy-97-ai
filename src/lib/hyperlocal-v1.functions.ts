/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: MERGE
 * Canonical owner: src/lib/happy-r129/enterprise-intelligence.ts
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/**
 * HAPPY X — Hyperlocal Intelligence OS (HIOS) API v1
 *
 * Central hyperlocal engine backing AAS PAAS. Everything routes through
 * the Service Layer + Supabase RLS; AI calls route through the Lovable
 * AI Gateway only.
 *
 * Governance (permanent HYPERLOCAL RULE):
 *   - Location data belongs to the user. Precise location is opt-in.
 *   - Background location requires explicit permission.
 *   - Businesses may only manage their own listings (owner_id = auth.uid()).
 *   - Recommendations are transparent; HAPPY does not imply endorsement.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError, AppError } from "@/services/core/errors";
import { z } from "zod";
import { sanitizePgRestLike } from "@/lib/security/pgrest-sanitize";

const uuid = z.string().uuid();
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

// Haversine distance in km. Cheap enough for in-memory filter of a bounded batch.
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const NearbyInput = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius_km: z.number().min(0.5).max(200).default(10),
  city: z.string().max(120).optional(),
  pincode: z.string().max(16).optional(),
  category: z.string().max(80).optional(),
  q: z.string().max(200).optional(),
  verified_only: z.boolean().default(false),
  open_now: z.boolean().default(false),
  min_rating: z.number().min(0).max(5).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

function filterNearby<T extends { latitude: number | null; longitude: number | null }>(
  rows: T[],
  lat?: number,
  lng?: number,
  radiusKm?: number,
): (T & { distance_km?: number })[] {
  if (lat == null || lng == null || radiusKm == null) return rows;
  return rows
    .map((r) => {
      if (r.latitude == null || r.longitude == null) return { ...r, distance_km: undefined };
      const d = haversineKm(lat, lng, r.latitude, r.longitude);
      return { ...r, distance_km: d };
    })
    .filter((r) => r.distance_km == null || (r.distance_km as number) <= radiusKm)
    .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
}

// =====================================================================
// USER LOCATION (opt-in)
// =====================================================================

export const hlGetMyLocation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("hl_user_location")
      .select("*").eq("user_id", context.userId).maybeSingle();
    if (r.error) throw r.error;
    return r.data;
  }));

const SetLocationInput = z.object({
  allow_precise: z.boolean().default(false),
  allow_background: z.boolean().default(false),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  city: z.string().max(120).optional(),
  pincode: z.string().max(16).optional(),
});

export const hlSetMyLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SetLocationInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    // Enforce opt-in: never store precise coords unless allow_precise is true.
    const lat = data.allow_precise ? data.latitude ?? null : null;
    const lng = data.allow_precise ? data.longitude ?? null : null;
    const r = await context.supabase.from("hl_user_location").upsert({
      user_id: context.userId,
      allow_precise: data.allow_precise,
      allow_background: data.allow_background,
      last_latitude: lat,
      last_longitude: lng,
      city: data.city ?? null,
      pincode: data.pincode ?? null,
      updated_at: new Date().toISOString(),
    }).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// PLACES
// =====================================================================

export const hlListPlaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("hl_places")
      .select("id, label, country, state, district, city, town, village, locality, pincode, latitude, longitude")
      .order("updated_at", { ascending: false }).limit(200);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

const CreatePlaceInput = z.object({
  label: z.string().max(160).optional(),
  country: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  district: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  town: z.string().max(120).optional(),
  village: z.string().max(120).optional(),
  locality: z.string().max(160).optional(),
  pincode: z.string().max(16).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export const hlCreatePlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreatePlaceInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("hl_places")
      .insert({ ...data, created_by: context.userId }).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// BUSINESSES
// =====================================================================

export const hlSearchBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NearbyInput.parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("hl_businesses")
      .select("id, owner_id, name, slug, category, subcategory, description, phone, whatsapp, website, address, city, pincode, latitude, longitude, hours, photos, offers, rating_avg, rating_count, verified, verification_status, status, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(Math.min(data.limit * 3, 300));
    if (data.category) q = q.eq("category", data.category);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.pincode) q = q.eq("pincode", data.pincode);
    if (data.verified_only) q = q.eq("verified", true);
    if (data.q) { const s = sanitizePgRestLike(data.q); if (s) q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`); }
    if (data.min_rating != null) q = q.gte("rating_avg", data.min_rating);
    const r = await q;
    if (r.error) throw r.error;
    const rows = filterNearby(r.data ?? [], data.latitude, data.longitude, data.radius_km);
    return rows.slice(0, data.limit);
  }));

export const hlGetBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("hl_businesses").select("*").eq("id", data.id).maybeSingle();
    if (r.error) throw r.error;
    if (!r.data) throw new AppError("RESOURCE.NOT_FOUND");
    return r.data;
  }));

const UpsertBusinessInput = z.object({
  id: uuid.optional(),
  name: z.string().min(1).max(160),
  category: z.string().min(1).max(80),
  subcategory: z.string().max(80).optional(),
  description: z.string().max(4000).optional(),
  phone: z.string().max(40).optional(),
  whatsapp: z.string().max(40).optional(),
  email: z.string().email().max(255).optional(),
  website: z.string().url().max(500).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(120).optional(),
  pincode: z.string().max(16).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  hours: z.record(z.any()).optional(),
  photos: z.array(z.string().url()).max(24).optional(),
  offers: z.array(z.record(z.any())).max(24).optional(),
});

export const hlUpsertBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertBusinessInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const payload = {
      ...data,
      owner_id: context.userId,
      hours: data.hours ?? {},
      photos: data.photos ?? [],
      offers: data.offers ?? [],
    };
    const q = data.id
      ? context.supabase.from("hl_businesses").update(payload).eq("id", data.id).eq("owner_id", context.userId).select("*").single()
      : context.supabase.from("hl_businesses").insert(payload).select("*").single();
    const r = await q;
    if (r.error) throw r.error;
    return r.data;
  }));

export const hlListMyBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("hl_businesses")
      .select("id, name, category, city, pincode, verified, verification_status, status, updated_at, rating_avg, rating_count")
      .eq("owner_id", context.userId).order("updated_at", { ascending: false }).limit(200);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

// =====================================================================
// JOBS
// =====================================================================

export const hlSearchJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NearbyInput.parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("hl_jobs")
      .select("id, title, description, job_type, category, city, pincode, latitude, longitude, pay_min, pay_max, currency, contact, business_id, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(Math.min(data.limit * 3, 300));
    if (data.category) q = q.eq("category", data.category);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.pincode) q = q.eq("pincode", data.pincode);
    if (data.q) { const s = sanitizePgRestLike(data.q); if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`); }
    const r = await q;
    if (r.error) throw r.error;
    return filterNearby(r.data ?? [], data.latitude, data.longitude, data.radius_km).slice(0, data.limit);
  }));

const UpsertJobInput = z.object({
  id: uuid.optional(),
  title: z.string().min(1).max(160),
  description: z.string().max(4000).optional(),
  job_type: z.enum(["full_time", "part_time", "internship", "daily_wage", "apprenticeship"]).default("full_time"),
  category: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  pincode: z.string().max(16).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  pay_min: z.number().nonnegative().optional(),
  pay_max: z.number().nonnegative().optional(),
  currency: z.string().max(8).default("INR"),
  contact: z.string().max(200).optional(),
  business_id: uuid.optional(),
});

export const hlUpsertJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertJobInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const payload = { ...data, posted_by: context.userId };
    const q = data.id
      ? context.supabase.from("hl_jobs").update(payload).eq("id", data.id).eq("posted_by", context.userId).select("*").single()
      : context.supabase.from("hl_jobs").insert(payload).select("*").single();
    const r = await q;
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// EVENTS
// =====================================================================

export const hlSearchEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NearbyInput.extend({ from: z.string().datetime().optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("hl_events")
      .select("id, title, description, category, starts_at, ends_at, venue, city, pincode, latitude, longitude, cover_url, organizer_id")
      .eq("status", "active")
      .gte("starts_at", data.from ?? new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order("starts_at", { ascending: true })
      .limit(Math.min(data.limit * 3, 300));
    if (data.category) q = q.eq("category", data.category);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.pincode) q = q.eq("pincode", data.pincode);
    if (data.q) { const s = sanitizePgRestLike(data.q); if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`); }
    const r = await q;
    if (r.error) throw r.error;
    return filterNearby(r.data ?? [], data.latitude, data.longitude, data.radius_km).slice(0, data.limit);
  }));

const UpsertEventInput = z.object({
  id: uuid.optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  category: z.string().max(80).optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().optional(),
  venue: z.string().max(200).optional(),
  city: z.string().max(120).optional(),
  pincode: z.string().max(16).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  cover_url: z.string().url().max(500).optional(),
});

export const hlUpsertEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertEventInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const payload = { ...data, organizer_id: context.userId };
    const q = data.id
      ? context.supabase.from("hl_events").update(payload).eq("id", data.id).eq("organizer_id", context.userId).select("*").single()
      : context.supabase.from("hl_events").insert(payload).select("*").single();
    const r = await q;
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// ALERTS
// =====================================================================

export const hlSearchAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NearbyInput.extend({ kind: z.string().max(40).optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("hl_alerts")
      .select("id, kind, severity, title, body, city, pincode, latitude, longitude, radius_km, expires_at, posted_by, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit * 3, 300));
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.pincode) q = q.eq("pincode", data.pincode);
    const r = await q;
    if (r.error) throw r.error;
    return filterNearby(r.data ?? [], data.latitude, data.longitude, data.radius_km).slice(0, data.limit);
  }));

const CreateAlertInput = z.object({
  kind: z.enum(["community", "emergency", "offer", "job", "event", "announcement"]).default("community"),
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  city: z.string().max(120).optional(),
  pincode: z.string().max(16).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius_km: z.number().min(0.5).max(200).default(5),
  expires_at: z.string().datetime().optional(),
});

export const hlCreateAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateAlertInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("hl_alerts")
      .insert({ ...data, posted_by: context.userId }).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// REVIEWS
// =====================================================================

export const hlListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ business_id: uuid, limit: z.number().int().min(1).max(100).default(50) }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("hl_reviews")
      .select("id, user_id, rating, comment, created_at")
      .eq("business_id", data.business_id)
      .order("created_at", { ascending: false }).limit(data.limit);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

const UpsertReviewInput = z.object({
  business_id: uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const hlUpsertReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertReviewInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("hl_reviews").upsert({
      business_id: data.business_id, user_id: context.userId,
      rating: data.rating, comment: data.comment ?? null,
    }, { onConflict: "business_id,user_id" }).select("*").single();
    if (r.error) throw r.error;

    // Recompute simple rating aggregate for the business.
    const agg = await context.supabase.from("hl_reviews")
      .select("rating").eq("business_id", data.business_id);
    if (!agg.error && agg.data) {
      const total = agg.data.length;
      const avg = total ? agg.data.reduce((s, x) => s + (x.rating ?? 0), 0) / total : 0;
      await context.supabase.from("hl_businesses")
        .update({ rating_avg: Number(avg.toFixed(2)), rating_count: total })
        .eq("id", data.business_id);
    }
    return r.data;
  }));

// =====================================================================
// VERIFICATION (owner-driven submission; approval handled by ops in future)
// =====================================================================

export const hlRequestVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ business_id: uuid, notes: z.string().max(2000).optional() }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("hl_businesses")
      .update({ verification_status: "pending", metadata: { verification_notes: data.notes ?? null } })
      .eq("id", data.business_id).eq("owner_id", context.userId).select("id, verification_status").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// DASHBOARD
// =====================================================================

export const hlDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const [b, j, e, a] = await Promise.all([
      context.supabase.from("hl_businesses").select("id", { count: "exact", head: true }).eq("status", "active"),
      context.supabase.from("hl_jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
      context.supabase.from("hl_events").select("id", { count: "exact", head: true }).eq("status", "active"),
      context.supabase.from("hl_alerts").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);
    return {
      businesses: b.count ?? 0,
      jobs: j.count ?? 0,
      events: e.count ?? 0,
      alerts: a.count ?? 0,
    };
  }));

// =====================================================================
// AI HYPERLOCAL ASSISTANT
// =====================================================================

const AskInput = z.object({
  question: z.string().min(1).max(1000),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  city: z.string().max(120).optional(),
  pincode: z.string().max(16).optional(),
  radius_km: z.number().min(0.5).max(200).default(10),
});

export const hlAskHappy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AskInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new AppError("AI.UNAVAILABLE", { developerMessage: "Missing LOVABLE_API_KEY" });

    // Retrieve nearby signal (bounded).
    let bq = context.supabase.from("hl_businesses")
      .select("name, category, city, pincode, latitude, longitude, description, rating_avg, verified")
      .eq("status", "active").limit(60);
    if (data.city) bq = bq.ilike("city", `%${data.city}%`);
    if (data.pincode) bq = bq.eq("pincode", data.pincode);
    const [{ data: biz }, { data: events }] = await Promise.all([
      bq,
      context.supabase.from("hl_events").select("title, category, starts_at, city, pincode, latitude, longitude")
        .eq("status", "active").gte("starts_at", new Date().toISOString()).limit(30),
    ]);
    const nearBiz = filterNearby(biz ?? [], data.latitude, data.longitude, data.radius_km).slice(0, 12);
    const nearEvents = filterNearby(events ?? [], data.latitude, data.longitude, data.radius_km).slice(0, 8);

    const context_block = [
      "NEARBY BUSINESSES:",
      ...nearBiz.map((b, i) => `[${i + 1}] ${b.name} — ${b.category}${b.verified ? " (verified)" : ""} · ${b.city ?? ""} ${b.pincode ?? ""}${b.rating_avg ? ` · ★${b.rating_avg}` : ""}`),
      "",
      "UPCOMING EVENTS:",
      ...nearEvents.map((e, i) => `[E${i + 1}] ${e.title} · ${e.category ?? ""} · ${e.starts_at} · ${e.city ?? ""}`),
    ].join("\n");

    const system = [
      "You are HAPPY — a hyperlocal AI assistant.",
      "Answer strictly using the supplied nearby context.",
      "Cite items as [1], [2] for businesses or [E1], [E2] for events.",
      "If nothing matches, say so plainly and suggest widening the search.",
      "Recommendations must be transparent — never imply endorsement.",
      "Respect user privacy: do not ask for precise location if not provided.",
    ].join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "hios-v1" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Question: ${data.question}\n\nContext:\n${context_block}` },
        ],
      }),
    });
    if (res.status === 429) throw new AppError("INFRA.RATE_LIMITED");
    if (res.status === 402) throw new AppError("AI.CREDITS_EXHAUSTED");
    if (!res.ok) throw new AppError("AI.UNAVAILABLE", { developerMessage: (await res.text()).slice(0, 300) });
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return {
      answer: json.choices?.[0]?.message?.content ?? "",
      businesses: nearBiz,
      events: nearEvents,
    };
  }));

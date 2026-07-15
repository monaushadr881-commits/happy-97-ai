import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;
type EntityType = "lead" | "customer" | "deal" | "company" | "contact";

async function logActivity(
  sb: SB,
  companyId: string,
  actorId: string,
  entityType: string,
  entityId: string | null,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  await sb.from("activity_events").insert({
    company_id: companyId,
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    source: "crm",
    metadata: metadata as never,
  });
}

async function notify(sb: SB, userId: string, kind: string, title: string, body: string, data: Record<string, unknown> = {}) {
  await sb.from("notifications").insert({
    user_id: userId,
    kind,
    title,
    body,
    data: data as never,
  } as never);
}

async function audit(
  sb: SB,
  action: string,
  entityType: string,
  entityId: string | null,
  companyId: string | null,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) {
  await sb.rpc("write_audit", {
    _category: "crm",
    _action: action,
    _entity_type: entityType,
    _entity_id: entityId ?? undefined,
    _company_id: companyId ?? undefined,
    _before: (before ?? undefined) as never,
    _after: (after ?? undefined) as never,
    _severity: "info",
    _metadata: {} as never,
  } as never);
}

// ---- Leads ----
export const leads = {
  async list(sb: SB, companyId: string, opts: { stage?: string; owner?: string; q?: string; limit?: number } = {}) {
    let q = sb.from("leads").select("*").eq("company_id", companyId).is("deleted_at", null);
    if (opts.stage) q = q.eq("stage", opts.stage as never);
    if (opts.owner) q = q.eq("owner_id", opts.owner);
    if (opts.q) q = q.or(`name.ilike.%${opts.q}%,email.ilike.%${opts.q}%,phone.ilike.%${opts.q}%`);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (error) throw error;
    return data ?? [];
  },
  async create(sb: SB, userId: string, input: { company_id: string; name: string; email?: string; phone?: string; source?: string; owner_id?: string; notes?: string; score?: number }) {
    const { data, error } = await sb.from("leads").insert({
      company_id: input.company_id,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      source: input.source ?? null,
      owner_id: input.owner_id ?? userId,
      notes: input.notes ?? null,
      score: input.score ?? 0,
      created_by: userId,
      updated_by: userId,
    } as never).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string; owner_id: string | null; name: string };
    await logActivity(sb, row.company_id, userId, "lead", row.id, "created", { name: row.name });
    await audit(sb, "lead.create", "lead", row.id, row.company_id, null, row as unknown as Record<string, unknown>);
    if (row.owner_id && row.owner_id !== userId) {
      await notify(sb, row.owner_id, "crm.lead_assigned", "New lead assigned", row.name, { lead_id: row.id });
    }
    return row;
  },
  async update(sb: SB, userId: string, id: string, patch: Partial<{ name: string; email: string; phone: string; source: string; stage: string; owner_id: string; notes: string; score: number; status: string }>) {
    const { data: before } = await sb.from("leads").select("*").eq("id", id).maybeSingle();
    if (!before) throw new Error("Lead not found");
    const { data, error } = await sb.from("leads").update({ ...(patch as never), updated_by: userId }).eq("id", id).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string; owner_id: string | null };
    await logActivity(sb, row.company_id, userId, "lead", row.id, "updated", patch as Record<string, unknown>);
    await audit(sb, "lead.update", "lead", row.id, row.company_id, before as never, row as never);
    if (patch.owner_id && patch.owner_id !== (before as { owner_id?: string }).owner_id) {
      await notify(sb, patch.owner_id, "crm.lead_assigned", "Lead assigned to you", (row as never as { name: string }).name ?? "", { lead_id: row.id });
    }
    return row;
  },
  async convert(sb: SB, userId: string, id: string) {
    const { data: lead, error } = await sb.from("leads").select("*").eq("id", id).single();
    if (error) throw error;
    const l = lead as { id: string; company_id: string; name: string; email: string | null; phone: string | null; brand_id: string | null };
    const { data: cust, error: cerr } = await sb.from("customers").insert({
      company_id: l.company_id,
      brand_id: l.brand_id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      billing_address: {} as never,
      shipping_address: {} as never,
      created_by: userId,
      updated_by: userId,
    } as never).select().single();
    if (cerr) throw cerr;
    await sb.from("leads").update({ status: "converted", stage: "won", updated_by: userId } as never).eq("id", id);
    const c = cust as { id: string };
    await logActivity(sb, l.company_id, userId, "lead", id, "converted", { customer_id: c.id });
    await audit(sb, "lead.convert", "lead", id, l.company_id, l as never, { customer_id: c.id });
    return { customer_id: c.id, lead_id: id };
  },
  async remove(sb: SB, userId: string, id: string) {
    const { data, error } = await sb.from("leads").update({ deleted_at: new Date().toISOString(), updated_by: userId } as never).eq("id", id).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string };
    await audit(sb, "lead.delete", "lead", id, row.company_id, null, null);
    return row;
  },
};

// ---- Customers ----
export const customers = {
  async list(sb: SB, companyId: string, opts: { q?: string; limit?: number } = {}) {
    let q = sb.from("customers").select("*").eq("company_id", companyId).is("deleted_at", null);
    if (opts.q) q = q.or(`name.ilike.%${opts.q}%,email.ilike.%${opts.q}%,phone.ilike.%${opts.q}%,code.ilike.%${opts.q}%`);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (error) throw error;
    return data ?? [];
  },
  async get(sb: SB, id: string) {
    const { data, error } = await sb.from("customers").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  async create(sb: SB, userId: string, input: { company_id: string; name: string; email?: string; phone?: string; code?: string; brand_id?: string }) {
    const { data, error } = await sb.from("customers").insert({
      company_id: input.company_id,
      brand_id: input.brand_id ?? null,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      code: input.code ?? null,
      billing_address: {} as never,
      shipping_address: {} as never,
      created_by: userId,
      updated_by: userId,
    } as never).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string; name: string };
    await logActivity(sb, row.company_id, userId, "customer", row.id, "created", { name: row.name });
    await audit(sb, "customer.create", "customer", row.id, row.company_id, null, row as never);
    return row;
  },
  async update(sb: SB, userId: string, id: string, patch: Record<string, unknown>) {
    const { data: before } = await sb.from("customers").select("*").eq("id", id).maybeSingle();
    if (!before) throw new Error("Customer not found");
    const { data, error } = await sb.from("customers").update({ ...(patch as never), updated_by: userId }).eq("id", id).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string };
    await logActivity(sb, row.company_id, userId, "customer", row.id, "updated", patch);
    await audit(sb, "customer.update", "customer", id, row.company_id, before as never, row as never);
    return row;
  },
  async profile(sb: SB, id: string) {
    const [customer, invoices, payments, subs, purchases, activity] = await Promise.all([
      sb.from("customers").select("*").eq("id", id).single(),
      sb.from("invoices").select("*").eq("customer_id", id).order("created_at", { ascending: false }).limit(50),
      sb.from("payments").select("*").eq("customer_id", id).order("created_at", { ascending: false }).limit(50),
      sb.from("subscriptions").select("*").eq("customer_id", id).limit(50),
      sb.from("listing_purchases").select("*").eq("buyer_id", id).limit(50),
      sb.from("activity_events").select("*").eq("entity_id", id).order("occurred_at", { ascending: false }).limit(100),
    ]);
    return {
      customer: customer.data,
      invoices: invoices.data ?? [],
      payments: payments.data ?? [],
      subscriptions: subs.data ?? [],
      marketplace_purchases: purchases.data ?? [],
      activity: activity.data ?? [],
    };
  },
};

// ---- Deals / Pipeline ----
const STAGE_PROBABILITY: Record<string, number> = { lead: 10, qualified: 30, proposal: 55, negotiation: 75, won: 100, lost: 0 };

export const deals = {
  async list(sb: SB, companyId: string, opts: { stage?: string; owner?: string; q?: string; limit?: number } = {}) {
    let q = sb.from("deals").select("*").eq("company_id", companyId).is("deleted_at", null);
    if (opts.stage) q = q.eq("stage", opts.stage as never);
    if (opts.owner) q = q.eq("owner_id", opts.owner);
    if (opts.q) q = q.ilike("title", `%${opts.q}%`);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 200);
    if (error) throw error;
    return data ?? [];
  },
  async pipeline(sb: SB, companyId: string) {
    const { data, error } = await sb.from("deals").select("stage,amount_cents,currency,status").eq("company_id", companyId).is("deleted_at", null);
    if (error) throw error;
    const stages = ["lead", "qualified", "proposal", "negotiation", "won", "lost"] as const;
    const buckets: Record<string, { count: number; value_cents: number }> = {};
    for (const s of stages) buckets[s] = { count: 0, value_cents: 0 };
    for (const d of (data ?? []) as Array<{ stage: string; amount_cents: number | null }>) {
      const b = buckets[d.stage] ?? (buckets[d.stage] = { count: 0, value_cents: 0 });
      b.count += 1;
      b.value_cents += Number(d.amount_cents ?? 0);
    }
    return buckets;
  },
  async create(sb: SB, userId: string, input: { company_id: string; title: string; customer_id?: string; lead_id?: string; amount_cents?: number; currency?: string; owner_id?: string; expected_close_at?: string; stage?: string }) {
    const stage = input.stage ?? "lead";
    const { data, error } = await sb.from("deals").insert({
      company_id: input.company_id,
      title: input.title,
      customer_id: input.customer_id ?? null,
      lead_id: input.lead_id ?? null,
      amount_cents: input.amount_cents ?? 0,
      currency: input.currency ?? "USD",
      owner_id: input.owner_id ?? userId,
      stage: stage as never,
      probability: STAGE_PROBABILITY[stage] ?? 10,
      expected_close_at: input.expected_close_at ?? null,
      created_by: userId,
      updated_by: userId,
    } as never).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string; owner_id: string | null; title: string };
    await logActivity(sb, row.company_id, userId, "deal", row.id, "created", { title: row.title });
    await audit(sb, "deal.create", "deal", row.id, row.company_id, null, row as never);
    return row;
  },
  async moveStage(sb: SB, userId: string, id: string, stage: string) {
    const { data: before } = await sb.from("deals").select("*").eq("id", id).single();
    if (!before) throw new Error("Deal not found");
    const patch: Record<string, unknown> = { stage, probability: STAGE_PROBABILITY[stage] ?? 10, updated_by: userId };
    if (stage === "won" || stage === "lost") {
      patch.closed_at = new Date().toISOString();
      patch.status = stage === "won" ? "active" : "archived";
    }
    const { data, error } = await sb.from("deals").update(patch as never).eq("id", id).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string; owner_id: string | null; title: string };
    await logActivity(sb, row.company_id, userId, "deal", row.id, "stage_changed", { from: (before as { stage: string }).stage, to: stage });
    await audit(sb, "deal.stage", "deal", id, row.company_id, before as never, row as never);
    if (stage === "won" && row.owner_id) await notify(sb, row.owner_id, "crm.deal_won", "Deal won", row.title, { deal_id: id });
    if (stage === "lost" && row.owner_id) await notify(sb, row.owner_id, "crm.deal_lost", "Deal lost", row.title, { deal_id: id });
    return row;
  },
  async update(sb: SB, userId: string, id: string, patch: Record<string, unknown>) {
    const { data: before } = await sb.from("deals").select("*").eq("id", id).single();
    const { data, error } = await sb.from("deals").update({ ...(patch as never), updated_by: userId }).eq("id", id).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string };
    await logActivity(sb, row.company_id, userId, "deal", id, "updated", patch);
    await audit(sb, "deal.update", "deal", id, row.company_id, before as never, row as never);
    return row;
  },
  async remove(sb: SB, userId: string, id: string) {
    const { data, error } = await sb.from("deals").update({ deleted_at: new Date().toISOString(), updated_by: userId } as never).eq("id", id).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string };
    await audit(sb, "deal.delete", "deal", id, row.company_id, null, null);
    return row;
  },
};

// ---- Tasks ----
export const tasks = {
  async list(sb: SB, companyId: string, opts: { status?: string; assignee?: string; entity_type?: EntityType; entity_id?: string; due_before?: string; limit?: number } = {}) {
    let q = sb.from("crm_tasks" as never).select("*").eq("company_id", companyId);
    if (opts.status) q = q.eq("status", opts.status);
    if (opts.assignee) q = q.eq("assignee_id", opts.assignee);
    if (opts.entity_type) q = q.eq("entity_type", opts.entity_type);
    if (opts.entity_id) q = q.eq("entity_id", opts.entity_id);
    if (opts.due_before) q = q.lte("due_at", opts.due_before);
    const { data, error } = await q.order("due_at", { ascending: true, nullsFirst: false }).limit(opts.limit ?? 200);
    if (error) throw error;
    return (data ?? []) as unknown[];
  },
  async create(sb: SB, userId: string, input: { company_id: string; title: string; description?: string; assignee_id?: string; due_at?: string; reminder_at?: string; kind?: string; priority?: string; entity_type?: EntityType; entity_id?: string; recurrence?: string }) {
    const { data, error } = await sb.from("crm_tasks" as never).insert({
      ...input,
      assignee_id: input.assignee_id ?? userId,
      created_by: userId,
    } as never).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string; assignee_id: string | null; title: string };
    await logActivity(sb, row.company_id, userId, "task", row.id, "created", { title: row.title });
    await audit(sb, "task.create", "task", row.id, row.company_id, null, row as never);
    if (row.assignee_id && row.assignee_id !== userId) {
      await notify(sb, row.assignee_id, "crm.task_assigned", "Task assigned", row.title, { task_id: row.id });
    }
    return row;
  },
  async update(sb: SB, userId: string, id: string, patch: Record<string, unknown>) {
    const { data: before } = await sb.from("crm_tasks" as never).select("*").eq("id", id).maybeSingle();
    if (!before) throw new Error("Task not found");
    const { data, error } = await sb.from("crm_tasks" as never).update(patch as never).eq("id", id).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string };
    await audit(sb, "task.update", "task", id, row.company_id, before as never, row as never);
    return row;
  },
  async complete(sb: SB, userId: string, id: string) {
    const { data, error } = await sb.from("crm_tasks" as never).update({ status: "completed", completed_at: new Date().toISOString() } as never).eq("id", id).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string; title: string };
    await logActivity(sb, row.company_id, userId, "task", id, "completed", { title: row.title });
    await audit(sb, "task.complete", "task", id, row.company_id, null, row as never);
    return row;
  },
  async reschedule(sb: SB, userId: string, id: string, due_at: string, reminder_at?: string) {
    return this.update(sb, userId, id, { due_at, reminder_at: reminder_at ?? null, status: "open" });
  },
  async remove(sb: SB, _userId: string, id: string) {
    const { error } = await sb.from("crm_tasks" as never).delete().eq("id", id);
    if (error) throw error;
    return { id };
  },
};

// ---- Notes ----
export const notes = {
  async list(sb: SB, entity_type: EntityType, entity_id: string, limit = 100) {
    const { data, error } = await sb.from("crm_notes" as never).select("*").eq("entity_type", entity_type).eq("entity_id", entity_id).order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown[];
  },
  async create(sb: SB, userId: string, input: { company_id: string; entity_type: EntityType; entity_id: string; body: string; pinned?: boolean; attachments?: unknown[] }) {
    const { data, error } = await sb.from("crm_notes" as never).insert({ ...input, author_id: userId } as never).select().single();
    if (error) throw error;
    const row = data as { id: string; company_id: string };
    await logActivity(sb, row.company_id, userId, input.entity_type, input.entity_id, "note_added", { note_id: row.id });
    return row;
  },
  async update(sb: SB, _userId: string, id: string, patch: { body?: string; pinned?: boolean; attachments?: unknown[] }) {
    const { data, error } = await sb.from("crm_notes" as never).update(patch as never).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async remove(sb: SB, _userId: string, id: string) {
    const { error } = await sb.from("crm_notes" as never).delete().eq("id", id);
    if (error) throw error;
    return { id };
  },
};

// ---- Activity timeline (unified) ----
export const activity = {
  async forEntity(sb: SB, entity_type: string, entity_id: string, limit = 100) {
    const { data, error } = await sb.from("activity_events").select("*").eq("entity_type", entity_type).eq("entity_id", entity_id).order("occurred_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  async forCompany(sb: SB, company_id: string, limit = 100) {
    const { data, error } = await sb.from("activity_events").select("*").eq("company_id", company_id).order("occurred_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};

// ---- Search ----
export const search = {
  async global(sb: SB, companyId: string, q: string, limit = 20) {
    const like = `%${q}%`;
    const [l, c, d] = await Promise.all([
      sb.from("leads").select("id,name,email,phone,stage").eq("company_id", companyId).is("deleted_at", null).or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`).limit(limit),
      sb.from("customers").select("id,name,email,phone,code").eq("company_id", companyId).is("deleted_at", null).or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like},code.ilike.${like}`).limit(limit),
      sb.from("deals").select("id,title,stage,amount_cents,currency").eq("company_id", companyId).is("deleted_at", null).ilike("title", like).limit(limit),
    ]);
    return { leads: l.data ?? [], customers: c.data ?? [], deals: d.data ?? [] };
  },
};

// ---- Founder / Company dashboard ----
export const dashboard = {
  async overview(sb: SB, companyId: string) {
    const [leadCount, custCount, pipeline, recentActivity, openTasks] = await Promise.all([
      sb.from("leads").select("id", { count: "exact", head: true }).eq("company_id", companyId).is("deleted_at", null),
      sb.from("customers").select("id", { count: "exact", head: true }).eq("company_id", companyId).is("deleted_at", null),
      deals.pipeline(sb, companyId),
      activity.forCompany(sb, companyId, 25),
      sb.from("crm_tasks" as never).select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "open"),
    ]);
    const won = pipeline.won?.count ?? 0;
    const lost = pipeline.lost?.count ?? 0;
    const total = won + lost;
    const conversion = total > 0 ? won / total : 0;
    const pipeline_value_cents = Object.entries(pipeline)
      .filter(([s]) => s !== "won" && s !== "lost")
      .reduce((sum, [, v]) => sum + v.value_cents, 0);
    return {
      leads: leadCount.count ?? 0,
      customers: custCount.count ?? 0,
      pipeline,
      pipeline_value_cents,
      won,
      lost,
      conversion_rate: conversion,
      open_tasks: openTasks.count ?? 0,
      recent_activity: recentActivity,
    };
  },
};

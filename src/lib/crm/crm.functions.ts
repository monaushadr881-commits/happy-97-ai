import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { leads, customers, deals, tasks, notes, activity, search, dashboard } from "./engine";

const auth = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]);
const authGet = () => createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]);

// ---------- Leads ----------
export const crmListLeads = auth()
  .inputValidator((d: { company_id: string; stage?: string; owner?: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => leads.list(context.supabase, data.company_id, data));

export const crmCreateLead = auth()
  .inputValidator((d: { company_id: string; name: string; email?: string; phone?: string; source?: string; owner_id?: string; notes?: string; score?: number }) => d)
  .handler(async ({ data, context }) => leads.create(context.supabase, context.userId, data));

export const crmUpdateLead = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => leads.update(context.supabase, context.userId, data.id, data.patch));

export const crmConvertLead = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => leads.convert(context.supabase, context.userId, data.id));

export const crmDeleteLead = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => leads.remove(context.supabase, context.userId, data.id));

// ---------- Customers ----------
export const crmListCustomers = auth()
  .inputValidator((d: { company_id: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => customers.list(context.supabase, data.company_id, data));

export const crmGetCustomer = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => customers.get(context.supabase, data.id));

export const crmCreateCustomer = auth()
  .inputValidator((d: { company_id: string; name: string; email?: string; phone?: string; code?: string; brand_id?: string }) => d)
  .handler(async ({ data, context }) => customers.create(context.supabase, context.userId, data));

export const crmUpdateCustomer = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => customers.update(context.supabase, context.userId, data.id, data.patch));

export const crmCustomerProfile = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => customers.profile(context.supabase, data.id));

// ---------- Deals / Pipeline ----------
export const crmListDeals = auth()
  .inputValidator((d: { company_id: string; stage?: string; owner?: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => deals.list(context.supabase, data.company_id, data));

export const crmPipeline = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => deals.pipeline(context.supabase, data.company_id));

export const crmCreateDeal = auth()
  .inputValidator((d: { company_id: string; title: string; customer_id?: string; lead_id?: string; amount_cents?: number; currency?: string; owner_id?: string; expected_close_at?: string; stage?: string }) => d)
  .handler(async ({ data, context }) => deals.create(context.supabase, context.userId, data));

export const crmMoveDealStage = auth()
  .inputValidator((d: { id: string; stage: string }) => d)
  .handler(async ({ data, context }) => deals.moveStage(context.supabase, context.userId, data.id, data.stage));

export const crmUpdateDeal = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => deals.update(context.supabase, context.userId, data.id, data.patch));

export const crmDeleteDeal = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => deals.remove(context.supabase, context.userId, data.id));

// ---------- Tasks ----------
export const crmListTasks = auth()
  .inputValidator((d: { company_id: string; status?: string; assignee?: string; entity_type?: "lead" | "customer" | "deal" | "company" | "contact"; entity_id?: string; due_before?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => tasks.list(context.supabase, data.company_id, data));

export const crmCreateTask = auth()
  .inputValidator((d: { company_id: string; title: string; description?: string; assignee_id?: string; due_at?: string; reminder_at?: string; kind?: string; priority?: string; entity_type?: "lead" | "customer" | "deal" | "company" | "contact"; entity_id?: string; recurrence?: string }) => d)
  .handler(async ({ data, context }) => tasks.create(context.supabase, context.userId, data));

export const crmUpdateTask = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => tasks.update(context.supabase, context.userId, data.id, data.patch));

export const crmCompleteTask = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => tasks.complete(context.supabase, context.userId, data.id));

export const crmRescheduleTask = auth()
  .inputValidator((d: { id: string; due_at: string; reminder_at?: string }) => d)
  .handler(async ({ data, context }) => tasks.reschedule(context.supabase, context.userId, data.id, data.due_at, data.reminder_at));

export const crmDeleteTask = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => tasks.remove(context.supabase, context.userId, data.id));

// ---------- Notes ----------
export const crmListNotes = auth()
  .inputValidator((d: { entity_type: "lead" | "customer" | "deal" | "company" | "contact"; entity_id: string; limit?: number }) => d)
  .handler(async ({ data, context }) => notes.list(context.supabase, data.entity_type, data.entity_id, data.limit));

export const crmCreateNote = auth()
  .inputValidator((d: { company_id: string; entity_type: "lead" | "customer" | "deal" | "company" | "contact"; entity_id: string; body: string; pinned?: boolean; attachments?: unknown[] }) => d)
  .handler(async ({ data, context }) => notes.create(context.supabase, context.userId, data));

export const crmUpdateNote = auth()
  .inputValidator((d: { id: string; patch: { body?: string; pinned?: boolean; attachments?: unknown[] } }) => d)
  .handler(async ({ data, context }) => notes.update(context.supabase, context.userId, data.id, data.patch));

export const crmDeleteNote = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => notes.remove(context.supabase, context.userId, data.id));

// ---------- Activity ----------
export const crmActivityForEntity = auth()
  .inputValidator((d: { entity_type: string; entity_id: string; limit?: number }) => d)
  .handler(async ({ data, context }) => activity.forEntity(context.supabase, data.entity_type, data.entity_id, data.limit));

export const crmActivityForCompany = auth()
  .inputValidator((d: { company_id: string; limit?: number }) => d)
  .handler(async ({ data, context }) => activity.forCompany(context.supabase, data.company_id, data.limit));

// ---------- Search ----------
export const crmSearch = auth()
  .inputValidator((d: { company_id: string; q: string; limit?: number }) => d)
  .handler(async ({ data, context }) => search.global(context.supabase, data.company_id, data.q, data.limit));

// ---------- Dashboard ----------
export const crmDashboard = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => dashboard.overview(context.supabase, data.company_id));

// keep GET builders referenced to avoid unused warnings
void authGet;

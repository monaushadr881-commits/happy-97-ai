/**
 * HAPPY X — R19 ERP Server Functions
 * Auth-gated RPC surface for the ERP runtime. RLS enforced via
 * `requireSupabaseAuth` supabase client (acts as the caller).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { org, vendors, approvals, purchase, sales, workflows, erpSearch, dashboards } from "./engine";

const auth = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]);
const authGet = () => createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]);

// ---------- Org ----------
export const erpListCompanies = authGet().handler(async ({ context }) => org.companies(context.supabase));
export const erpListBranches = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => org.branches(context.supabase, data.company_id));
export const erpListDepartments = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => org.departments(context.supabase, data.company_id));
export const erpListBusinessUnits = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => org.businessUnits(context.supabase, data.company_id));

// ---------- Vendors ----------
export const erpListVendors = auth()
  .inputValidator((d: { company_id: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => vendors.list(context.supabase, data.company_id, data));
export const erpGetVendor = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => vendors.get(context.supabase, data.id));
export const erpCreateVendor = auth()
  .inputValidator((d: Parameters<typeof vendors.create>[2]) => d)
  .handler(async ({ data, context }) => vendors.create(context.supabase, context.userId, data));
export const erpUpdateVendor = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => vendors.update(context.supabase, context.userId, data.id, data.patch));
export const erpDeleteVendor = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => vendors.remove(context.supabase, context.userId, data.id));

// ---------- Approvals ----------
export const erpListApprovals = auth()
  .inputValidator((d: { company_id: string; status?: string; entity_type?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => approvals.list(context.supabase, data.company_id, data));
export const erpCreateApproval = auth()
  .inputValidator((d: Parameters<typeof approvals.create>[2]) => d)
  .handler(async ({ data, context }) => approvals.create(context.supabase, context.userId, data));
export const erpApprove = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => approvals.decide(context.supabase, context.userId, data.id, "approved", data.reason));
export const erpReject = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => approvals.decide(context.supabase, context.userId, data.id, "rejected", data.reason));
export const erpCancelApproval = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => approvals.cancel(context.supabase, context.userId, data.id));

// ---------- Purchase Orders ----------
export const erpListPurchaseOrders = auth()
  .inputValidator((d: { company_id: string; status?: string; supplier?: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => purchase.list(context.supabase, data.company_id, data));
export const erpGetPurchaseOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => purchase.get(context.supabase, data.id));
export const erpCreatePurchaseOrder = auth()
  .inputValidator((d: Parameters<typeof purchase.create>[2]) => d)
  .handler(async ({ data, context }) => purchase.create(context.supabase, context.userId, data));
export const erpSubmitPurchaseOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => purchase.submit(context.supabase, context.userId, data.id));
export const erpReceivePurchaseOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => purchase.receive(context.supabase, context.userId, data.id));
export const erpCancelPurchaseOrder = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => purchase.cancel(context.supabase, context.userId, data.id, data.reason));

// ---------- Sales Orders ----------
export const erpListSalesOrders = auth()
  .inputValidator((d: { company_id: string; status?: string; customer?: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => sales.list(context.supabase, data.company_id, data));
export const erpGetSalesOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => sales.get(context.supabase, data.id));
export const erpCreateSalesOrder = auth()
  .inputValidator((d: Parameters<typeof sales.create>[2]) => d)
  .handler(async ({ data, context }) => sales.create(context.supabase, context.userId, data));
export const erpSubmitSalesOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => sales.submit(context.supabase, context.userId, data.id));
export const erpFulfillSalesOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => sales.fulfill(context.supabase, context.userId, data.id));
export const erpCancelSalesOrder = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => sales.cancel(context.supabase, context.userId, data.id, data.reason));

// ---------- Workflows ----------
export const erpListWorkflows = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => workflows.list(context.supabase, data.company_id));
export const erpListWorkflowRuns = auth()
  .inputValidator((d: { company_id: string; workflow_id?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => workflows.runs(context.supabase, data.company_id, data));
export const erpTriggerWorkflow = auth()
  .inputValidator((d: { workflow_id: string; input?: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => workflows.trigger(context.supabase, context.userId, data.workflow_id, data.input ?? {}));

// ---------- Search ----------
export const erpSearchAll = auth()
  .inputValidator((d: { company_id: string; q: string; limit?: number }) => d)
  .handler(async ({ data, context }) => erpSearch.search(context.supabase, data.company_id, data.q, data.limit ?? 25));

// ---------- Dashboards ----------
export const erpCompanyDashboard = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => dashboards.company(context.supabase, data.company_id));
export const erpFounderDashboard = authGet()
  .handler(async ({ context }) => dashboards.founder(context.supabase));

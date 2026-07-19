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
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpListVendors", source: "api", module: "erp.erpListVendors" });
    return vendors.list(context.supabase, data.company_id, data);
  });export const erpGetVendor = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpGetVendor", source: "api", module: "erp.erpGetVendor" });
    return vendors.get(context.supabase, data.id);
  });export const erpCreateVendor = auth()
  .inputValidator((d: Parameters<typeof vendors.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreateVendor", source: "api", module: "erp.erpCreateVendor" });
    return vendors.create(context.supabase, context.userId, data);
  });export const erpUpdateVendor = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpUpdateVendor", source: "api", module: "erp.erpUpdateVendor" });
    return vendors.update(context.supabase, context.userId, data.id, data.patch);
  });export const erpDeleteVendor = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpDeleteVendor", source: "api", module: "erp.erpDeleteVendor" });
    return vendors.remove(context.supabase, context.userId, data.id);
  });
// ---------- Approvals ----------
export const erpListApprovals = auth()
  .inputValidator((d: { company_id: string; status?: string; entity_type?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => approvals.list(context.supabase, data.company_id, data));
export const erpCreateApproval = auth()
  .inputValidator((d: Parameters<typeof approvals.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreateApproval", source: "api", module: "erp.erpCreateApproval" });
    return approvals.create(context.supabase, context.userId, data);
  });export const erpApprove = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpApprove", source: "api", module: "erp.erpApprove" });
    return approvals.decide(context.supabase, context.userId, data.id, "approved", data.reason);
  });export const erpReject = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpReject", source: "api", module: "erp.erpReject" });
    return approvals.decide(context.supabase, context.userId, data.id, "rejected", data.reason);
  });export const erpCancelApproval = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCancelApproval", source: "api", module: "erp.erpCancelApproval" });
    return approvals.cancel(context.supabase, context.userId, data.id);
  });
// ---------- Purchase Orders ----------
export const erpListPurchaseOrders = auth()
  .inputValidator((d: { company_id: string; status?: string; supplier?: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => purchase.list(context.supabase, data.company_id, data));
export const erpGetPurchaseOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => purchase.get(context.supabase, data.id));
export const erpCreatePurchaseOrder = auth()
  .inputValidator((d: Parameters<typeof purchase.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreatePurchaseOrder", source: "api", module: "erp.erpCreatePurchaseOrder" });
    return purchase.create(context.supabase, context.userId, data);
  });export const erpSubmitPurchaseOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpSubmitPurchaseOrder", source: "api", module: "erp.erpSubmitPurchaseOrder" });
    return purchase.submit(context.supabase, context.userId, data.id);
  });export const erpReceivePurchaseOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => purchase.receive(context.supabase, context.userId, data.id));
export const erpCancelPurchaseOrder = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCancelPurchaseOrder", source: "api", module: "erp.erpCancelPurchaseOrder" });
    return purchase.cancel(context.supabase, context.userId, data.id, data.reason);
  });
// ---------- Sales Orders ----------
export const erpListSalesOrders = auth()
  .inputValidator((d: { company_id: string; status?: string; customer?: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => sales.list(context.supabase, data.company_id, data));
export const erpGetSalesOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => sales.get(context.supabase, data.id));
export const erpCreateSalesOrder = auth()
  .inputValidator((d: Parameters<typeof sales.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreateSalesOrder", source: "api", module: "erp.erpCreateSalesOrder" });
    return sales.create(context.supabase, context.userId, data);
  });export const erpSubmitSalesOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpSubmitSalesOrder", source: "api", module: "erp.erpSubmitSalesOrder" });
    return sales.submit(context.supabase, context.userId, data.id);
  });export const erpFulfillSalesOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpFulfillSalesOrder", source: "api", module: "erp.erpFulfillSalesOrder" });
    return sales.fulfill(context.supabase, context.userId, data.id);
  });export const erpCancelSalesOrder = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCancelSalesOrder", source: "api", module: "erp.erpCancelSalesOrder" });
    return sales.cancel(context.supabase, context.userId, data.id, data.reason);
  });
// ---------- Workflows ----------
export const erpListWorkflows = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => workflows.list(context.supabase, data.company_id));
export const erpListWorkflowRuns = auth()
  .inputValidator((d: { company_id: string; workflow_id?: string; limit?: number }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpListWorkflowRuns", source: "api", module: "erp.erpListWorkflowRuns" });
    return workflows.runs(context.supabase, data.company_id, data);
  });export const erpTriggerWorkflow = auth()
  .inputValidator((d: { workflow_id: string; input?: Record<string, unknown> }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpTriggerWorkflow", source: "api", module: "erp.erpTriggerWorkflow" });
    return workflows.trigger(context.supabase, context.userId, data.workflow_id, data.input ?? {});
  });
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

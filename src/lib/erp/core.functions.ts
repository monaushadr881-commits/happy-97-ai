/**
 * HAPPY X — R22 ERP Core server functions.
 * Auth-gated RPC surface for purchase requests, vendor quotations,
 * goods receipts, vendor catalog, and approval delegations.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  purchaseRequests, quotations, goodsReceipts, vendorCatalog, delegations, coreDashboard,
} from "./core";

const auth = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]);

// Purchase Requests
export const erpListPurchaseRequests = auth()
  .inputValidator((d: { company_id: string; status?: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => purchaseRequests.list(context.supabase, data.company_id, data));
export const erpGetPurchaseRequest = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => purchaseRequests.get(context.supabase, data.id));
export const erpCreatePurchaseRequest = auth()
  .inputValidator((d: Parameters<typeof purchaseRequests.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreatePurchaseRequest", source: "api", module: "erp.core.erpCreatePurchaseRequest" });
    return purchaseRequests.create(context.supabase, context.userId, data);
  });export const erpSubmitPurchaseRequest = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpSubmitPurchaseRequest", source: "api", module: "erp.core.erpSubmitPurchaseRequest" });
    return purchaseRequests.submit(context.supabase, context.userId, data.id);
  });export const erpCancelPurchaseRequest = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCancelPurchaseRequest", source: "api", module: "erp.core.erpCancelPurchaseRequest" });
    return purchaseRequests.cancel(context.supabase, context.userId, data.id, data.reason);
  });export const erpDeletePurchaseRequest = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpDeletePurchaseRequest", source: "api", module: "erp.core.erpDeletePurchaseRequest" });
    return purchaseRequests.remove(context.supabase, context.userId, data.id);
  });
// Quotations
export const erpListQuotations = auth()
  .inputValidator((d: { company_id: string; request_id?: string; supplier_id?: string; status?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => quotations.list(context.supabase, data.company_id, data));
export const erpCreateQuotation = auth()
  .inputValidator((d: Parameters<typeof quotations.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreateQuotation", source: "api", module: "erp.core.erpCreateQuotation" });
    return quotations.create(context.supabase, context.userId, data);
  });export const erpSetQuotationStatus = auth()
  .inputValidator((d: { id: string; status: "received"|"shortlisted"|"awarded"|"rejected"|"expired" }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpSetQuotationStatus", source: "api", module: "erp.core.erpSetQuotationStatus" });
    return quotations.setStatus(context.supabase, context.userId, data.id, data.status);
  });export const erpDeleteQuotation = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpDeleteQuotation", source: "api", module: "erp.core.erpDeleteQuotation" });
    return quotations.remove(context.supabase, context.userId, data.id);
  });
// Goods Receipts
export const erpListGoodsReceipts = auth()
  .inputValidator((d: { company_id: string; po_id?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => goodsReceipts.list(context.supabase, data.company_id, data));
export const erpGetGoodsReceipt = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => goodsReceipts.get(context.supabase, data.id));
export const erpCreateGoodsReceipt = auth()
  .inputValidator((d: Parameters<typeof goodsReceipts.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreateGoodsReceipt", source: "api", module: "erp.core.erpCreateGoodsReceipt" });
    return goodsReceipts.create(context.supabase, context.userId, data);
  });
// Vendor Categories
export const erpListVendorCategories = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpListVendorCategories", source: "api", module: "erp.core.erpListVendorCategories" });
    return vendorCatalog.categories(context.supabase, data.company_id);
  });export const erpCreateVendorCategory = auth()
  .inputValidator((d: { company_id: string; name: string; slug: string; description?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreateVendorCategory", source: "api", module: "erp.core.erpCreateVendorCategory" });
    return vendorCatalog.createCategory(context.supabase, data);
  });export const erpDeleteVendorCategory = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpDeleteVendorCategory", source: "api", module: "erp.core.erpDeleteVendorCategory" });
    return vendorCatalog.deleteCategory(context.supabase, data.id);
  });export const erpAssignVendorCategory = auth()
  .inputValidator((d: { supplier_id: string; category_id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpAssignVendorCategory", source: "api", module: "erp.core.erpAssignVendorCategory" });
    return vendorCatalog.assign(context.supabase, data.supplier_id, data.category_id);
  });export const erpUnassignVendorCategory = auth()
  .inputValidator((d: { supplier_id: string; category_id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpUnassignVendorCategory", source: "api", module: "erp.core.erpUnassignVendorCategory" });
    return vendorCatalog.unassign(context.supabase, data.supplier_id, data.category_id);
  });export const erpSupplierCategories = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.supplierCategories(context.supabase, data.supplier_id));

// Vendor Ratings
export const erpVendorRatings = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpVendorRatings", source: "api", module: "erp.core.erpVendorRatings" });
    return vendorCatalog.ratings(context.supabase, data.supplier_id);
  });export const erpVendorRatingAverage = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpVendorRatingAverage", source: "api", module: "erp.core.erpVendorRatingAverage" });
    return vendorCatalog.averageRating(context.supabase, data.supplier_id);
  });export const erpRateVendor = auth()
  .inputValidator((d: { company_id: string; supplier_id: string; rating: number; comment?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpRateVendor", source: "api", module: "erp.core.erpRateVendor" });
    return vendorCatalog.rate(context.supabase, context.userId, data);
  });
// Vendor Documents
export const erpVendorDocuments = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpVendorDocuments", source: "api", module: "erp.core.erpVendorDocuments" });
    return vendorCatalog.documents(context.supabase, data.supplier_id);
  });export const erpAddVendorDocument = auth()
  .inputValidator((d: { company_id: string; supplier_id: string; kind?: string; name: string; url: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpAddVendorDocument", source: "api", module: "erp.core.erpAddVendorDocument" });
    return vendorCatalog.addDocument(context.supabase, context.userId, data);
  });export const erpRemoveVendorDocument = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpRemoveVendorDocument", source: "api", module: "erp.core.erpRemoveVendorDocument" });
    return vendorCatalog.removeDocument(context.supabase, data.id);
  });
// Vendor Contracts
export const erpVendorContracts = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpVendorContracts", source: "api", module: "erp.core.erpVendorContracts" });
    return vendorCatalog.contracts(context.supabase, data.supplier_id);
  });export const erpCreateVendorContract = auth()
  .inputValidator((d: Parameters<typeof vendorCatalog.createContract>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreateVendorContract", source: "api", module: "erp.core.erpCreateVendorContract" });
    return vendorCatalog.createContract(context.supabase, data);
  });export const erpUpdateVendorContract = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpUpdateVendorContract", source: "api", module: "erp.core.erpUpdateVendorContract" });
    return vendorCatalog.updateContract(context.supabase, data.id, data.patch);
  });export const erpDeleteVendorContract = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpDeleteVendorContract", source: "api", module: "erp.core.erpDeleteVendorContract" });
    return vendorCatalog.deleteContract(context.supabase, data.id);
  });
// Approval Delegations
export const erpListDelegations = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => delegations.list(context.supabase, data.company_id));
export const erpCreateDelegation = auth()
  .inputValidator((d: Parameters<typeof delegations.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpCreateDelegation", source: "api", module: "erp.core.erpCreateDelegation" });
    return delegations.create(context.supabase, context.userId, data);
  });export const erpRevokeDelegation = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "erpRevokeDelegation", source: "api", module: "erp.core.erpRevokeDelegation" });
    return delegations.revoke(context.supabase, data.id);
  });export const erpActiveDelegationsForMe = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => delegations.activeFor(context.supabase, data.company_id, context.userId));

// Dashboard
export const erpCoreDashboard = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => coreDashboard.company(context.supabase, data.company_id));

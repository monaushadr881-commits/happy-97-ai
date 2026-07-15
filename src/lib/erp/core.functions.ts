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
  .handler(async ({ data, context }) => purchaseRequests.create(context.supabase, context.userId, data));
export const erpSubmitPurchaseRequest = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => purchaseRequests.submit(context.supabase, context.userId, data.id));
export const erpCancelPurchaseRequest = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => purchaseRequests.cancel(context.supabase, context.userId, data.id, data.reason));
export const erpDeletePurchaseRequest = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => purchaseRequests.remove(context.supabase, context.userId, data.id));

// Quotations
export const erpListQuotations = auth()
  .inputValidator((d: { company_id: string; request_id?: string; supplier_id?: string; status?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => quotations.list(context.supabase, data.company_id, data));
export const erpCreateQuotation = auth()
  .inputValidator((d: Parameters<typeof quotations.create>[2]) => d)
  .handler(async ({ data, context }) => quotations.create(context.supabase, context.userId, data));
export const erpSetQuotationStatus = auth()
  .inputValidator((d: { id: string; status: "received"|"shortlisted"|"awarded"|"rejected"|"expired" }) => d)
  .handler(async ({ data, context }) => quotations.setStatus(context.supabase, context.userId, data.id, data.status));
export const erpDeleteQuotation = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => quotations.remove(context.supabase, context.userId, data.id));

// Goods Receipts
export const erpListGoodsReceipts = auth()
  .inputValidator((d: { company_id: string; po_id?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => goodsReceipts.list(context.supabase, data.company_id, data));
export const erpGetGoodsReceipt = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => goodsReceipts.get(context.supabase, data.id));
export const erpCreateGoodsReceipt = auth()
  .inputValidator((d: Parameters<typeof goodsReceipts.create>[2]) => d)
  .handler(async ({ data, context }) => goodsReceipts.create(context.supabase, context.userId, data));

// Vendor Categories
export const erpListVendorCategories = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.categories(context.supabase, data.company_id));
export const erpCreateVendorCategory = auth()
  .inputValidator((d: { company_id: string; name: string; slug: string; description?: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.createCategory(context.supabase, data));
export const erpDeleteVendorCategory = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.deleteCategory(context.supabase, data.id));
export const erpAssignVendorCategory = auth()
  .inputValidator((d: { supplier_id: string; category_id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.assign(context.supabase, data.supplier_id, data.category_id));
export const erpUnassignVendorCategory = auth()
  .inputValidator((d: { supplier_id: string; category_id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.unassign(context.supabase, data.supplier_id, data.category_id));
export const erpSupplierCategories = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.supplierCategories(context.supabase, data.supplier_id));

// Vendor Ratings
export const erpVendorRatings = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.ratings(context.supabase, data.supplier_id));
export const erpVendorRatingAverage = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.averageRating(context.supabase, data.supplier_id));
export const erpRateVendor = auth()
  .inputValidator((d: { company_id: string; supplier_id: string; rating: number; comment?: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.rate(context.supabase, context.userId, data));

// Vendor Documents
export const erpVendorDocuments = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.documents(context.supabase, data.supplier_id));
export const erpAddVendorDocument = auth()
  .inputValidator((d: { company_id: string; supplier_id: string; kind?: string; name: string; url: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.addDocument(context.supabase, context.userId, data));
export const erpRemoveVendorDocument = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.removeDocument(context.supabase, data.id));

// Vendor Contracts
export const erpVendorContracts = auth()
  .inputValidator((d: { supplier_id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.contracts(context.supabase, data.supplier_id));
export const erpCreateVendorContract = auth()
  .inputValidator((d: Parameters<typeof vendorCatalog.createContract>[1]) => d)
  .handler(async ({ data, context }) => vendorCatalog.createContract(context.supabase, data));
export const erpUpdateVendorContract = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => vendorCatalog.updateContract(context.supabase, data.id, data.patch));
export const erpDeleteVendorContract = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => vendorCatalog.deleteContract(context.supabase, data.id));

// Approval Delegations
export const erpListDelegations = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => delegations.list(context.supabase, data.company_id));
export const erpCreateDelegation = auth()
  .inputValidator((d: Parameters<typeof delegations.create>[2]) => d)
  .handler(async ({ data, context }) => delegations.create(context.supabase, context.userId, data));
export const erpRevokeDelegation = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => delegations.revoke(context.supabase, data.id));
export const erpActiveDelegationsForMe = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => delegations.activeFor(context.supabase, data.company_id, context.userId));

// Dashboard
export const erpCoreDashboard = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => coreDashboard.company(context.supabase, data.company_id));

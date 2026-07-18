/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: MERGE
 * Canonical owner: src/lib/happy-r129/enterprise-intelligence.ts
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/**
 * HAPPY X — Enterprise API v1 (server functions)
 *
 * Company-scoped RPCs for the Enterprise Control Center. All requests go
 * through the authenticated Supabase client — RLS enforces per-company
 * isolation (`is_company_member`, `is_company_admin`). UI never touches
 * the database directly; only these functions.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError } from "@/services/core/errors";
import { z } from "zod";

const uuid = z.string().uuid();
const CompanyId = z.object({ company_id: uuid });
const CompanyIdWithLimit = z.object({ company_id: uuid, limit: z.number().int().min(1).max(200).optional() });

const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

// ---------------- Company Overview (KPIs) ----------------
export const entCompanyOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyId.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const s = context.supabase;
    const cid = data.company_id;
    const head = { count: "exact" as const, head: true };
    const [brands, workspaces, employees, customers, orders, invoices, departments, offices, workflows, announcements] = await Promise.all([
      s.from("brands").select("id", head).eq("company_id", cid),
      s.from("workspaces").select("id", head).eq("company_id", cid),
      s.from("employees").select("id", head).eq("company_id", cid),
      s.from("customers").select("id", head).eq("company_id", cid),
      s.from("sales_orders").select("id", head).eq("company_id", cid),
      s.from("invoices").select("id", head).eq("company_id", cid),
      s.from("departments").select("id", head).eq("company_id", cid),
      s.from("offices").select("id", head).eq("company_id", cid),
      s.from("workflows").select("id", head).eq("company_id", cid),
      s.from("posts").select("id", head).eq("company_id", cid),
    ]);
    return {
      brands: brands.count ?? 0,
      workspaces: workspaces.count ?? 0,
      employees: employees.count ?? 0,
      customers: customers.count ?? 0,
      orders: orders.count ?? 0,
      invoices: invoices.count ?? 0,
      departments: departments.count ?? 0,
      offices: offices.count ?? 0,
      workflows: workflows.count ?? 0,
      announcements: announcements.count ?? 0,
    };
  }));

// ---------------- Directory / Structure ----------------
const list =
  <T extends string>(table: T, cols: string, orderBy: string, desc = true) =>
    createServerFn({ method: "POST" })
      .middleware([requireSupabaseAuth])
      .inputValidator((i: unknown) => CompanyIdWithLimit.parse(i))
      .handler(async ({ data, context }) => guard(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = (context.supabase as any)
          .from(table).select(cols)
          .eq("company_id", data.company_id)
          .order(orderBy, { ascending: !desc })
          .limit(data.limit ?? 50);
        const { data: rows, error } = await q;
        if (error) throw error;
        return rows ?? [];
      }));

export const entListEmployees = list(
  "employees",
  "id, user_id, department_id, job_title, employment_type, status, hired_at",
  "hired_at",
);
export const entListCustomers = list(
  "customers",
  "id, display_name, email, phone, status, lifetime_value_cents, created_at",
  "created_at",
);
export const entListOrders = list(
  "sales_orders",
  "id, order_number, customer_id, status, total_cents, currency, created_at",
  "created_at",
);
export const entListInvoices = list(
  "invoices",
  "id, invoice_number, customer_id, status, total_cents, currency, issued_at",
  "issued_at",
);
export const entListDepartments = list(
  "departments",
  "id, name, code, business_unit_id, parent_id, status",
  "name",
  false,
);
export const entListOffices = list(
  "offices",
  "id, name, city, country, timezone, status",
  "name",
  false,
);
export const entListWorkflows = list(
  "workflows",
  "id, name, description, status, category, created_at",
  "created_at",
);
export const entListAnnouncements = list(
  "posts",
  "id, title, status, published_at, created_at, author_id",
  "created_at",
);
export const entListKnowledge = list(
  "knowledge_articles",
  "id, title, status, category_id, published_at, updated_at",
  "updated_at",
);
export const entListCourses = list(
  "courses",
  "id, title, status, level, published_at, updated_at",
  "updated_at",
);
export const entListMedia = list(
  "media_assets",
  "id, file_name, mime_type, size_bytes, status, created_at",
  "created_at",
);

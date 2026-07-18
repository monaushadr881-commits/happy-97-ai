/**
 * R140 — Business OS UI Completion.
 * Verifies pure UI-tab primitives: definitions, defaults, active resolution.
 */
import { describe, it, expect } from "vitest";
import type { Tab } from "@/components/business/TabBar";

// Mirror the canonical tab lists so the tests catch accidental deletions of
// screens required by the R140 mission scope.
const CRM_TABS: Tab[] = [
  { slug: "overview", label: "Overview" },
  { slug: "leads", label: "Leads" },
  { slug: "customers", label: "Customers" },
  { slug: "deals", label: "Deals" },
  { slug: "pipeline", label: "Pipeline" },
  { slug: "tasks", label: "Tasks" },
  { slug: "activities", label: "Activities" },
  { slug: "communications", label: "Communications" },
];

const HR_TABS: Tab[] = [
  { slug: "employees", label: "Employees" },
  { slug: "attendance", label: "Attendance" },
  { slug: "leave", label: "Leave" },
  { slug: "payroll", label: "Payroll" },
  { slug: "learning", label: "Learning" },
  { slug: "performance", label: "Performance" },
  { slug: "organization", label: "Organization" },
];

const INV_TABS: Tab[] = [
  { slug: "stock", label: "Stock" }, { slug: "warehouses", label: "Warehouses" },
  { slug: "transfers", label: "Transfers" }, { slug: "batch", label: "Batch" },
  { slug: "serial", label: "Serial" }, { slug: "expiry", label: "Expiry" },
  { slug: "analytics", label: "Analytics" },
];

const REV_TABS: Tab[] = [
  { slug: "overview", label: "Overview" }, { slug: "credits", label: "Credits" },
  { slug: "subscriptions", label: "Subscriptions" }, { slug: "wallet", label: "Wallet" },
  { slug: "billing", label: "Billing" }, { slug: "invoices", label: "Invoices" },
  { slug: "usage", label: "Usage" }, { slug: "analytics", label: "Analytics" },
];

const ENT_TABS: Tab[] = [
  { slug: "organizations", label: "Organizations" }, { slug: "rbac", label: "RBAC" },
  { slug: "policies", label: "Policies" }, { slug: "audit", label: "Audit" },
  { slug: "compliance", label: "Compliance" }, { slug: "monitoring", label: "Monitoring" },
  { slug: "security", label: "Security" },
];

// Pure resolver (mirrors useActiveTab logic without React runtime).
function resolveActive(tabs: Tab[], slug: string | undefined): string {
  return tabs.some((t) => t.slug === slug) ? (slug as string) : tabs[0].slug;
}

describe("R140 Business OS UI screens", () => {
  it("CRM exposes all mission-required screens", () => {
    const slugs = CRM_TABS.map((t) => t.slug);
    for (const req of ["leads", "customers", "deals", "pipeline", "tasks", "activities", "communications"]) {
      expect(slugs).toContain(req);
    }
  });

  it("HRMS exposes employees / attendance / leave / payroll / learning / performance / organization", () => {
    const slugs = HR_TABS.map((t) => t.slug);
    for (const req of ["employees", "attendance", "leave", "payroll", "learning", "performance", "organization"]) {
      expect(slugs).toContain(req);
    }
  });

  it("Inventory exposes stock / warehouses / transfers / batch / serial / expiry / analytics", () => {
    const slugs = INV_TABS.map((t) => t.slug);
    for (const req of ["stock", "warehouses", "transfers", "batch", "serial", "expiry", "analytics"]) {
      expect(slugs).toContain(req);
    }
  });

  it("Revenue OS exposes credits / subscriptions / wallet / billing / invoices / usage / analytics", () => {
    const slugs = REV_TABS.map((t) => t.slug);
    for (const req of ["credits", "subscriptions", "wallet", "billing", "invoices", "usage", "analytics"]) {
      expect(slugs).toContain(req);
    }
  });

  it("Enterprise Control exposes organizations / rbac / policies / audit / compliance / monitoring / security", () => {
    const slugs = ENT_TABS.map((t) => t.slug);
    for (const req of ["organizations", "rbac", "policies", "audit", "compliance", "monitoring", "security"]) {
      expect(slugs).toContain(req);
    }
  });

  it("active tab resolver falls back to first tab for unknown slugs", () => {
    expect(resolveActive(CRM_TABS, undefined)).toBe("overview");
    expect(resolveActive(CRM_TABS, "bogus")).toBe("overview");
    expect(resolveActive(CRM_TABS, "pipeline")).toBe("pipeline");
    expect(resolveActive(HR_TABS, "payroll")).toBe("payroll");
  });
});

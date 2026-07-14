/**
 * HAPPY X — Enterprise Company Context
 * Selected-company state for the /enterprise subtree, persisted per user.
 * Company IDs never touch the URL of unrelated routes — every enterprise
 * query is scoped to the selected id and enforced by RLS server-side.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiListCompanies } from "@/lib/api-v1.functions";

type Company = { id: string; display_name?: string; legal_name?: string; slug?: string | null };

type Ctx = {
  companies: Company[];
  companyId: string | null;
  setCompanyId: (id: string) => void;
  current: Company | null;
  loading: boolean;
};

const EnterpriseCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "hxp.enterprise.company";

export function EnterpriseProvider({ children }: { children: ReactNode }) {
  const q = useQuery({ queryKey: ["enterprise", "companies"], queryFn: () => apiListCompanies() });
  const companies = (q.data ?? []) as unknown as Company[];
  const [companyId, setCompanyIdState] = useState<string | null>(null);

  // Initial hydrate: last-used > first company.
  useEffect(() => {
    if (companyId || !companies.length) return;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const match = stored && companies.find((c) => c.id === stored);
    setCompanyIdState(match ? stored : companies[0].id);
  }, [companies, companyId]);

  const setCompanyId = (id: string) => {
    setCompanyIdState(id);
    try { window.localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  };

  const current = useMemo(() => companies.find((c) => c.id === companyId) ?? null, [companies, companyId]);

  return (
    <EnterpriseCtx.Provider value={{ companies, companyId, setCompanyId, current, loading: q.isLoading }}>
      {children}
    </EnterpriseCtx.Provider>
  );
}

export function useEnterprise() {
  const ctx = useContext(EnterpriseCtx);
  if (!ctx) throw new Error("useEnterprise must be used inside <EnterpriseProvider>");
  return ctx;
}

/** Convenience: guard rendering until a company is selected. */
export function useSelectedCompanyId(): string | null {
  return useEnterprise().companyId;
}

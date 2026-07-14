/**
 * HAPPY X — Business OS Company Context
 * Per-user selected-company state for the /business subtree.
 * All queries are scoped to this ID and enforced by RLS server-side.
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

const BusinessCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "hxp.business.company";

export function BusinessProvider({ children }: { children: ReactNode }) {
  const q = useQuery({ queryKey: ["business", "companies"], queryFn: () => apiListCompanies() });
  const companies = (q.data ?? []) as unknown as Company[];
  const [companyId, setCompanyIdState] = useState<string | null>(null);

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
    <BusinessCtx.Provider value={{ companies, companyId, setCompanyId, current, loading: q.isLoading }}>
      {children}
    </BusinessCtx.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessCtx);
  if (!ctx) throw new Error("useBusiness must be used inside <BusinessProvider>");
  return ctx;
}

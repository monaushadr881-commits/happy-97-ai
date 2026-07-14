/**
 * Education OS — per-user selected company (for creator scope) & mode state.
 * "Student" and "Creator" are HAPPY X permission surfaces, NOT user roles.
 * Any authenticated user is a student by default; company members may also
 * see the Creator studio (write access is enforced by RLS at the row level).
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
  canCreate: boolean;
};

const EduCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "hxp.edu.company";

export function EducationProvider({ children }: { children: ReactNode }) {
  const q = useQuery({ queryKey: ["edu", "companies"], queryFn: () => apiListCompanies() });
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
    <EduCtx.Provider value={{ companies, companyId, setCompanyId, current, canCreate: companies.length > 0 }}>
      {children}
    </EduCtx.Provider>
  );
}

export function useEducation() {
  const ctx = useContext(EduCtx);
  if (!ctx) throw new Error("useEducation must be used inside <EducationProvider>");
  return ctx;
}

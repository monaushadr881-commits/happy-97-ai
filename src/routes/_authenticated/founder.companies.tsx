/**
 * /founder/companies — Company Management.
 * List, inspect and create companies via the versioned API. Brand management
 * drills in per company. All mutations go through apiCreateCompany / apiCreateBrand.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, Hairline, EmptyState } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { apiListCompanies, apiCreateCompany, apiListBrands, apiCreateBrand } from "@/lib/api-v1.functions";
import { Building2, Plus, Layers } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/founder/companies")({
  head: () => ({ meta: [{ title: "Companies — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderCompanies,
});

type Company = { id: string; display_name?: string; legal_name?: string; slug?: string | null; status?: string | null; created_at?: string };

function FounderCompanies() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const list = useQuery({ queryKey: ["founder", "companies"], queryFn: () => apiListCompanies() });

  const createCo = useMutation({
    mutationFn: (input: { display_name: string; legal_name: string; slug: string }) => apiCreateCompany({ data: input }),
    onSuccess: () => {
      toast.success("Company created");
      qc.invalidateQueries({ queryKey: ["founder", "companies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nameOf = (c: Company) => c.display_name ?? c.legal_name ?? c.slug ?? c.id.slice(0, 8);
  const companies = ((list.data ?? []) as unknown as Company[]).filter((c) =>
    !q ? true : nameOf(c).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Companies"
        description="Every legal entity in the HAPPY X ecosystem — brands, workspaces and business units roll up here."
        actions={<CreateCompanyDialog onCreate={(v) => createCo.mutate(v)} pending={createCo.isPending} />}
      />

      <div className="mb-4 flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search companies…"
          className="max-w-xs bg-white/[0.02] border-white/10"
        />
        <Chip tone="gold">{companies.length} total</Chip>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-0 overflow-hidden">
          <ul className="divide-y divide-white/5">
            {companies.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c.id)}
                  className={`w-full text-left p-4 flex items-center justify-between hover:bg-white/[0.03] transition ${selected === c.id ? "bg-gold/[0.06]" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-gold/10 text-gold">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-paper">{c.name}</div>
                      <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">{c.slug ?? c.id.slice(0, 8)}</div>
                    </div>
                  </div>
                  <Chip tone={c.status === "active" ? "success" : "neutral"}>{c.status ?? "—"}</Chip>
                </button>
              </li>
            ))}
            {!companies.length && (
              <li className="p-6">
                <EmptyState
                  icon={<Building2 className="h-5 w-5" />}
                  title="No companies yet"
                  description="Create the first company to spin up brands, workspaces and business units."
                />
              </li>
            )}
          </ul>
        </Panel>

        <CompanyDetail id={selected} />
      </div>
    </>
  );
}

function CreateCompanyDialog({ onCreate, pending }: { onCreate: (v: { name: string; slug: string }) => void; pending: boolean }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gold text-obsidian hover:bg-gold-bright">
          <Plus className="h-4 w-4 mr-1" /> New Company
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-obsidian border-white/10">
        <DialogHeader><DialogTitle className="text-paper">Create Company</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Legal name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/[0.02] border-white/10" />
          <Input placeholder="slug-like-this" value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-white/[0.02] border-white/10" />
        </div>
        <DialogFooter>
          <Button
            disabled={!name || !slug || pending}
            onClick={() => { onCreate({ name, slug }); setOpen(false); setName(""); setSlug(""); }}
            className="bg-gold text-obsidian hover:bg-gold-bright"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompanyDetail({ id }: { id: string | null }) {
  const qc = useQueryClient();
  const brands = useQuery({
    queryKey: ["founder", "brands", id],
    enabled: !!id,
    queryFn: () => apiListBrands({ data: { company_id: id! } }),
  });
  const createBrand = useMutation({
    mutationFn: (input: { name: string; slug: string }) =>
      apiCreateBrand({ data: { ...input, company_id: id! } }),
    onSuccess: () => {
      toast.success("Brand created");
      qc.invalidateQueries({ queryKey: ["founder", "brands", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const [bn, setBn] = useState("");
  const [bs, setBs] = useState("");

  if (!id) {
    return (
      <Panel className="p-6">
        <EmptyState icon={<Layers className="h-5 w-5" />} title="Select a company" description="View brand hierarchy and issue commands." />
      </Panel>
    );
  }
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Brands</h3>
        <Chip tone="gold">{(brands.data as unknown[] | undefined)?.length ?? 0}</Chip>
      </div>
      <Hairline className="my-4" />
      <ul className="space-y-2">
        {((brands.data ?? []) as Array<{ id: string; name: string; slug?: string | null }>).map((b) => (
          <li key={b.id} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-3">
            <div>
              <div className="text-paper">{b.name}</div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">{b.slug}</div>
            </div>
          </li>
        ))}
        {!((brands.data as unknown[] | undefined)?.length) && (
          <li className="text-xs text-soft-gray">No brands yet.</li>
        )}
      </ul>

      <div className="mt-6 space-y-2">
        <Input placeholder="New brand name" value={bn} onChange={(e) => setBn(e.target.value)} className="bg-white/[0.02] border-white/10" />
        <Input placeholder="brand-slug" value={bs} onChange={(e) => setBs(e.target.value)} className="bg-white/[0.02] border-white/10" />
        <Button
          size="sm"
          disabled={!bn || !bs || createBrand.isPending}
          onClick={() => { createBrand.mutate({ name: bn, slug: bs }); setBn(""); setBs(""); }}
          className="w-full bg-gold text-obsidian hover:bg-gold-bright"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Brand
        </Button>
      </div>
    </Panel>
  );
}

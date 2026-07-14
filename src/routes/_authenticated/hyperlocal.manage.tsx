/** /hyperlocal/manage — owner-only management of own listings. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, Hairline, EmptyState } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { hlListMyBusinesses, hlUpsertBusiness, hlRequestVerification } from "@/lib/hyperlocal-v1.functions";
import { Store, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hyperlocal/manage")({
  head: () => ({ meta: [{ title: "My Hyperlocal Listings — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: Manage,
});

function Manage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["hl", "mine"], queryFn: () => hlListMyBusinesses() });

  const [form, setForm] = useState({ name: "", category: "", city: "", pincode: "", phone: "", whatsapp: "", website: "", description: "" });
  const create = useMutation({
    mutationFn: () => hlUpsertBusiness({ data: {
      name: form.name, category: form.category,
      city: form.city || undefined, pincode: form.pincode || undefined,
      phone: form.phone || undefined, whatsapp: form.whatsapp || undefined,
      website: form.website || undefined, description: form.description || undefined,
    } }),
    onSuccess: () => {
      toast.success("Listing saved");
      setForm({ name: "", category: "", city: "", pincode: "", phone: "", whatsapp: "", website: "", description: "" });
      qc.invalidateQueries({ queryKey: ["hl", "mine"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verify = useMutation({
    mutationFn: (id: string) => hlRequestVerification({ data: { business_id: id } }),
    onSuccess: () => { toast.success("Verification requested"); qc.invalidateQueries({ queryKey: ["hl", "mine"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="My Listings"
        title="Manage your hyperlocal presence"
        description="You may only manage listings you own. Verification is a request; approval is handled by ops."
      />

      <Panel className="p-5 mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Add a business</div>
        <Hairline className="mb-4" />
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (form.name && form.category) create.mutate(); }}>
          <Input placeholder="Business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Category (e.g. electrician, cafe)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="md:col-span-2" />
          <Textarea placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={create.isPending || !form.name || !form.category}>Save listing</Button>
          </div>
        </form>
      </Panel>

      <Panel className="p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Your businesses</div>
        <Hairline className="mb-4" />
        {list.isLoading ? <div className="text-xs text-soft-gray">Loading…</div>
          : !list.data?.length ? <EmptyState icon={<Store className="h-5 w-5" />} title="No listings yet" description="Create your first listing above." />
          : (
            <div className="grid gap-3 md:grid-cols-2">
              {list.data.map((b) => (
                <div key={b.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-paper">{b.name}</div>
                    <Chip tone={b.verified ? "gold" : b.verification_status === "pending" ? "warning" : "neutral"}>
                      {b.verified ? "Verified" : b.verification_status === "pending" ? "Verification pending" : "Unverified"}
                    </Chip>
                  </div>
                  <div className="text-[11px] text-soft-gray mt-1">{b.category} · {b.city ?? "—"} {b.pincode ?? ""}</div>
                  <div className="text-[11px] text-soft-gray mt-1">★ {Number(b.rating_avg ?? 0).toFixed(1)} ({b.rating_count ?? 0})</div>
                  {!b.verified && b.verification_status !== "pending" && (
                    <Button size="sm" variant="ghost" className="mt-2 gap-1 text-xs" onClick={() => verify.mutate(b.id)}>
                      <ShieldCheck className="h-3.5 w-3.5" /> Request verification
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
      </Panel>
    </>
  );
}

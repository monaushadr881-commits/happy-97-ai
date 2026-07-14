/** /hyperlocal/alerts — community & emergency alerts. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, EmptyState } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hlSearchAlerts, hlCreateAlert } from "@/lib/hyperlocal-v1.functions";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hyperlocal/alerts")({
  head: () => ({ meta: [{ title: "Nearby Alerts — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: Alerts,
});

function Alerts() {
  const qc = useQueryClient();
  const [city, setCity] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"community" | "emergency" | "offer" | "announcement">("community");

  const list = useQuery({ queryKey: ["hl", "alerts", city], queryFn: () => hlSearchAlerts({ data: { city: city || undefined, limit: 48 } }) });
  const create = useMutation({
    mutationFn: () => hlCreateAlert({ data: { title, body: body || undefined, city: city || undefined, kind, severity: kind === "emergency" ? "critical" : "info" } }),
    onSuccess: () => { toast.success("Alert posted"); setTitle(""); setBody(""); qc.invalidateQueries({ queryKey: ["hl", "alerts"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="Alerts" title="Community, emergency & offers" description="Post an alert scoped to your city. Emergencies show as critical." />

      <Panel className="p-4 mb-6">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_160px_140px_auto]" onSubmit={(e) => { e.preventDefault(); if (title.trim()) create.mutate(); }}>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Details (optional)" value={body} onChange={(e) => setBody(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="rounded-md bg-white/[0.03] border border-white/10 text-sm text-paper px-2">
            <option value="community">Community</option>
            <option value="emergency">Emergency</option>
            <option value="offer">Offer</option>
            <option value="announcement">Announcement</option>
          </select>
          <Button type="submit" disabled={create.isPending}>Post</Button>
        </form>
      </Panel>

      {list.isLoading ? <div className="text-xs text-soft-gray">Loading…</div>
        : !list.data?.length ? <EmptyState icon={<Bell className="h-5 w-5" />} title="No alerts" description="Nothing active in this area." />
        : (
          <div className="grid gap-3 md:grid-cols-2">
            {list.data.map((a) => (
              <Panel key={a.id} className="p-4">
                <div className="flex items-center gap-2">
                  <Chip tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "info"}>{a.severity}</Chip>
                  <Chip>{a.kind}</Chip>
                  <span className="ml-auto text-[10px] text-soft-gray">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm text-paper mt-2">{a.title}</div>
                {a.body && <p className="text-xs text-soft-gray mt-1">{a.body}</p>}
                <div className="text-[11px] text-soft-gray mt-2">{a.city ?? "—"} {a.pincode ?? ""}</div>
              </Panel>
            ))}
          </div>
        )}
    </>
  );
}

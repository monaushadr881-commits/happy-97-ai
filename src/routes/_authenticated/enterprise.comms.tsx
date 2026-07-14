/** /enterprise/comms — Announcements + user notifications. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { entListAnnouncements } from "@/lib/enterprise-v1.functions";
import { apiMyNotifications, apiMarkNotificationRead } from "@/lib/api-v1.functions";
import { Megaphone, Bell, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/enterprise/comms")({
  head: () => ({ meta: [{ title: "Communications — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: Comms,
});

function Comms() {
  const qc = useQueryClient();
  const { companyId, companies } = useEnterprise();
  const ann = useQuery({ queryKey: ["ent", "announcements", companyId], enabled: !!companyId, queryFn: () => entListAnnouncements({ data: { company_id: companyId! } }) });
  const notifs = useQuery({ queryKey: ["ent", "notifs"], queryFn: () => apiMyNotifications() });
  const markRead = useMutation({
    mutationFn: (id: string) => apiMarkNotificationRead({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ent", "notifs"] }); toast.success("Marked as read"); },
  });

  if (!companyId) return (<><PageHeader eyebrow="Communications" title="Communications" /><NoCompanySelected hasAny={companies.length > 0} /></>);

  return (
    <>
      <PageHeader eyebrow="Communications" title="Communications Hub" description="Announcements, email, SMS, in-app — one comms surface per company." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Announcements</h2>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {((ann.data ?? []) as Array<{ id: string; title: string; status?: string; published_at?: string }>).map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate text-paper">{a.title}</span>
                <div className="flex items-center gap-2">
                  <Chip tone={a.status === "published" ? "success" : "neutral"}>{a.status ?? "—"}</Chip>
                  <time className="numeric text-[11px] text-soft-gray">{a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}</time>
                </div>
              </li>
            ))}
            {!((ann.data as unknown[] | undefined)?.length) && <li className="py-2 text-xs text-soft-gray">No announcements.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">My Notifications</h2>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {((notifs.data ?? []) as Array<{ id: string; title?: string; body?: string; read_at?: string | null; created_at?: string }>).map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{n.title ?? "Notification"}</div>
                  <div className="truncate text-[11px] text-soft-gray">{n.body ?? ""}</div>
                </div>
                {!n.read_at && (
                  <Button size="sm" variant="outline" onClick={() => markRead.mutate(n.id)} className="border-white/10 text-paper hover:bg-white/5">
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </li>
            ))}
            {!((notifs.data as unknown[] | undefined)?.length) && <li className="py-2 text-xs text-soft-gray">All caught up.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}

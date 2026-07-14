/** /enterprise/content — Knowledge · Courses · Media · Announcements. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import {
  entListKnowledge, entListCourses, entListMedia, entListAnnouncements,
} from "@/lib/enterprise-v1.functions";
import { BookOpen, GraduationCap, ImageIcon, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise/content")({
  head: () => ({ meta: [{ title: "Content — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: Content,
});

function Content() {
  const { companyId, companies } = useEnterprise();
  const knowledge = useQuery({ queryKey: ["ent", "kb", companyId], enabled: !!companyId, queryFn: () => entListKnowledge({ data: { company_id: companyId! } }) });
  const courses = useQuery({ queryKey: ["ent", "courses", companyId], enabled: !!companyId, queryFn: () => entListCourses({ data: { company_id: companyId! } }) });
  const media = useQuery({ queryKey: ["ent", "media", companyId], enabled: !!companyId, queryFn: () => entListMedia({ data: { company_id: companyId! } }) });
  const ann = useQuery({ queryKey: ["ent", "ann", companyId], enabled: !!companyId, queryFn: () => entListAnnouncements({ data: { company_id: companyId! } }) });

  if (!companyId) return (<><PageHeader eyebrow="Content" title="Content" /><NoCompanySelected hasAny={companies.length > 0} /></>);

  return (
    <>
      <PageHeader eyebrow="Content" title="Content Management" description="Knowledge, courses, media and announcements — approval and publishing workflows in one plane." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={<BookOpen className="h-4 w-4 text-gold" />} title="Knowledge">
          {(knowledge.data as Array<{ id: string; title: string; status?: string; updated_at?: string }>)?.map((k) => (
            <Row key={k.id} title={k.title} status={k.status} date={k.updated_at} />
          )) ?? null}
        </Section>
        <Section icon={<GraduationCap className="h-4 w-4 text-gold" />} title="Courses">
          {(courses.data as Array<{ id: string; title: string; status?: string; level?: string; updated_at?: string }>)?.map((c) => (
            <Row key={c.id} title={c.title} status={c.status} subtitle={c.level} date={c.updated_at} />
          )) ?? null}
        </Section>
        <Section icon={<ImageIcon className="h-4 w-4 text-gold" />} title="Media">
          {(media.data as Array<{ id: string; file_name: string; mime_type?: string; size_bytes?: number; created_at?: string }>)?.map((m) => (
            <Row key={m.id} title={m.file_name} subtitle={`${m.mime_type ?? ""} · ${((m.size_bytes ?? 0) / 1024).toFixed(1)} KB`} date={m.created_at} />
          )) ?? null}
        </Section>
        <Section icon={<Megaphone className="h-4 w-4 text-gold" />} title="Announcements">
          {(ann.data as Array<{ id: string; title: string; status?: string; published_at?: string }>)?.map((a) => (
            <Row key={a.id} title={a.title} status={a.status} date={a.published_at} />
          )) ?? null}
        </Section>
      </div>
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">{icon}<h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">{title}</h2></div>
        <Chip tone="gold">{items.length}</Chip>
      </div>
      <Hairline className="my-4" />
      <ul className="divide-y divide-white/5">{items.length ? children : <li className="py-2 text-xs text-soft-gray">Nothing yet.</li>}</ul>
    </Panel>
  );
}
function Row({ title, subtitle, status, date }: { title: string; subtitle?: string; status?: string; date?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <div className="min-w-0">
        <div className="truncate text-paper">{title}</div>
        {subtitle && <div className="text-[11px] text-soft-gray">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2">
        {status && <Chip tone={status === "published" ? "success" : status === "draft" ? "neutral" : "info"}>{status}</Chip>}
        {date && <time className="numeric text-[11px] text-soft-gray">{new Date(date).toLocaleDateString()}</time>}
      </div>
    </li>
  );
}

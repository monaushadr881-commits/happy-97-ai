/** /business/projects — Project & task workspace registry. */
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { FolderKanban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/projects")({
  head: () => ({ meta: [{ title: "Projects — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Projects,
});

const MODULES = [
  { name: "Project Registry", desc: "Company-wide project index with owners and milestones." },
  { name: "Task Management", desc: "Sprints, backlog, kanban, subtasks and dependencies." },
  { name: "Document Management", desc: "Files, versioning and per-project drives." },
  { name: "Meeting Management", desc: "Scheduled calls with linked notes and action items." },
  { name: "Calendar Management", desc: "Team calendars, capacity, and personal timelines." },
];

function Projects() {
  const { companyId, companies } = useBusiness();
  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Projects" /><NoCompany hasAny={companies.length > 0} /></>);
  return (
    <>
      <PageHeader eyebrow="Business OS" title="Projects & Collaboration" description="Projects, tasks, meetings, documents and calendars — glued to the Enterprise structure." />
      <Panel className="p-5">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Collaboration Modules</h2>
          <Chip tone="info">Foundation Ready</Chip>
        </div>
        <Hairline className="my-4" />
        <div className="grid gap-3 md:grid-cols-2">
          {MODULES.map((m) => (
            <div key={m.name} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
              <div className="text-sm text-paper">{m.name}</div>
              <div className="text-[11px] text-soft-gray mt-1">{m.desc}</div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

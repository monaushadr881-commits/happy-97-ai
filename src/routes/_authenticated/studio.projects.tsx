/** /studio/projects — Creator OS projects. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  creatorListProjects, creatorCreateProject, creatorArchiveProject,
  creatorDeleteProject, PROJECT_KINDS,
} from "@/lib/creator-v1.functions";
import { Archive, ArchiveRestore, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio/projects")({
  head: () => ({ meta: [{ title: "Projects — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["creator", "projects"], queryFn: () => creatorListProjects() });
  const [name, setName] = useState("");
  const [kind, setKind] = useState<string>("general");
  const [desc, setDesc] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["creator", "projects"] });
  const create = useMutation({
    mutationFn: () => creatorCreateProject({ data: { name, kind: kind as any, description: desc || undefined } }),
    onSuccess: () => { setName(""); setDesc(""); invalidate(); toast.success("Project created"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const archive = useMutation({
    mutationFn: (v: { id: string; archived: boolean }) => creatorArchiveProject({ data: v }),
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: (id: string) => creatorDeleteProject({ data: { id } }),
    onSuccess: invalidate,
  });

  return (
    <>
      <PageHeader eyebrow="Creator OS" title="Projects" description="Group creative work by client, campaign, or brand." />

      <Panel className="p-5 mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">New project</div>
        <Hairline className="mb-4" />
        <div className="grid gap-3 md:grid-cols-[1fr_10rem_auto]">
          <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJECT_KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => name.trim() && create.mutate()} disabled={!name.trim() || create.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Create
          </Button>
        </div>
        <Textarea className="mt-3" rows={2} placeholder="Optional description"
          value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Panel>

      <Panel className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.2em] text-soft-gray">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Kind</th>
              <th className="p-3">Updated</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="p-3 text-paper">
                  {p.name}
                  {p.archived && <Chip tone="neutral" className="ml-2">Archived</Chip>}
                  {p.description && <div className="text-[11px] text-soft-gray mt-0.5">{p.description}</div>}
                </td>
                <td className="p-3 text-soft-gray uppercase text-[10px] tracking-[0.15em]">{p.kind}</td>
                <td className="p-3 text-soft-gray text-xs">{new Date(p.updated_at).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => archive.mutate({ id: p.id, archived: !p.archived })}>
                    {p.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}
            {(q.data ?? []).length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-xs text-soft-gray">No projects yet.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

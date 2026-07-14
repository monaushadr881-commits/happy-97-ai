/** /studio/marketing — Marketing Studio. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { creatorGenerateCopy, creatorRecentGenerations } from "@/lib/creator-v1.functions";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio/marketing")({
  head: () => ({ meta: [{ title: "Marketing Studio — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: MarketingStudio,
});

const CHANNELS: Array<{ id: string; label: string; format: any }> = [
  { id: "instagram", label: "Instagram", format: "social" },
  { id: "linkedin",  label: "LinkedIn",  format: "social" },
  { id: "facebook",  label: "Facebook",  format: "social" },
  { id: "email",     label: "Email",     format: "email" },
  { id: "ad",        label: "Paid ad",   format: "ad" },
  { id: "landing",   label: "Landing",   format: "landing" },
];

function MarketingStudio() {
  const qc = useQueryClient();
  const [channel, setChannel] = useState("instagram");
  const [brief, setBrief] = useState("");
  const [audience, setAudience] = useState("");
  const [output, setOutput] = useState("");

  const recent = useQuery({
    queryKey: ["creator", "recent", "marketing"],
    queryFn: () => creatorRecentGenerations({ data: { studio: "marketing", limit: 8 } }),
  });

  const gen = useMutation({
    mutationFn: () => {
      const fmt = CHANNELS.find((c) => c.id === channel)?.format ?? "ad";
      return creatorGenerateCopy({ data: { studio: "marketing", brief, audience: audience || undefined, format: fmt } });
    },
    onSuccess: (a: any) => { setOutput(a.text ?? ""); toast.success("Campaign copy ready"); qc.invalidateQueries({ queryKey: ["creator"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="Marketing Studio" title="Campaigns, ads and social" description="Multi-channel copy for launches, campaigns and always-on marketing." />

      <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
        <Panel className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Compose</div>
          <Hairline className="mb-3" />
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CHANNELS.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input className="mt-2" placeholder="Audience (optional)" value={audience} onChange={(e) => setAudience(e.target.value)} />
          <Textarea className="mt-2" rows={6} placeholder="Campaign brief — what is being promoted?" value={brief} onChange={(e) => setBrief(e.target.value)} />
          <Button className="mt-3 w-full" onClick={() => brief.trim() && gen.mutate()} disabled={!brief.trim() || gen.isPending}>
            <Megaphone className="h-4 w-4 mr-1" /> {gen.isPending ? "Writing…" : "Generate"}
          </Button>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-5 min-h-[16rem]">
            <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Output</div>
            <Hairline className="mb-3" />
            {output ? (
              <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{output}</ReactMarkdown></div>
            ) : <div className="text-xs text-soft-gray">Your campaign copy will appear here.</div>}
          </Panel>

          <Panel className="p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Recent</div>
            <Hairline className="mb-3" />
            <ul className="divide-y divide-white/5">
              {(recent.data ?? []).map((g) => (
                <li key={g.id} className="py-2 flex items-center gap-2 text-xs">
                  <Chip tone="gold">{g.operation}</Chip>
                  <span className="text-paper truncate flex-1">{g.prompt}</span>
                  <span className="text-[10px] text-soft-gray/60">{new Date(g.created_at).toLocaleString()}</span>
                </li>
              ))}
              {(recent.data ?? []).length === 0 && <li className="py-4 text-center text-xs text-soft-gray">No campaigns yet.</li>}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

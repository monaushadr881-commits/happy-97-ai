/** /studio/copy — Copy Studio. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { creatorGenerateCopy } from "@/lib/creator-v1.functions";
import { PenLine } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio/copy")({
  head: () => ({ meta: [{ title: "Copy Studio — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: CopyStudio,
});

const FORMATS = ["ad","email","social","blog","landing","script","press_release","product_description"] as const;

function CopyStudio() {
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("ad");
  const [output, setOutput] = useState("");

  const gen = useMutation({
    mutationFn: () => creatorGenerateCopy({ data: { studio: "copy", brief, tone: tone || undefined, audience: audience || undefined, format } }),
    onSuccess: (a: any) => { setOutput(a.text ?? ""); toast.success("Copy generated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="Copy Studio" title="Long and short-form copy"
        description="Ads, emails, blogs, product copy — written in a consistent voice." />

      <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
        <Panel className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Brief</div>
          <Hairline className="mb-3" />
          <Textarea rows={6} placeholder="What are we writing about?" value={brief} onChange={(e) => setBrief(e.target.value)} />
          <Input className="mt-2" placeholder="Audience (optional)" value={audience} onChange={(e) => setAudience(e.target.value)} />
          <Input className="mt-2" placeholder="Tone (optional) — e.g. confident, warm" value={tone} onChange={(e) => setTone(e.target.value)} />
          <Select value={format} onValueChange={(v) => setFormat(v as any)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>{FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
          <Button className="mt-3 w-full" onClick={() => brief.trim() && gen.mutate()} disabled={!brief.trim() || gen.isPending}>
            <PenLine className="h-4 w-4 mr-1" /> {gen.isPending ? "Writing…" : "Write copy"}
          </Button>
        </Panel>

        <Panel className="p-5 min-h-[24rem]">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Output</div>
          <Hairline className="mb-3" />
          {output ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-xs text-soft-gray">Your copy will appear here.</div>
          )}
        </Panel>
      </div>
    </>
  );
}

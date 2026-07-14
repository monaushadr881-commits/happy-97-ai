/** /studio/image — Image Studio (generate + edit). */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  creatorGenerateImage, creatorEditImage, creatorListAssets,
} from "@/lib/creator-v1.functions";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio/image")({
  head: () => ({ meta: [{ title: "Image Studio — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: ImageStudio,
});

const MODELS = [
  { id: "google/gemini-3-pro-image", label: "Gemini 3 Pro Image (best)" },
  { id: "google/gemini-3.1-flash-image", label: "Nano Banana 2 (fast)" },
  { id: "google/gemini-2.5-flash-image", label: "Nano Banana" },
  { id: "openai/gpt-image-2", label: "GPT-Image 2" },
  { id: "openai/gpt-image-1-mini", label: "GPT-Image 1 Mini" },
];

function ImageStudio() {
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("square");
  const [model, setModel] = useState(MODELS[0].id);
  const [selected, setSelected] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");

  const recent = useQuery({
    queryKey: ["creator", "assets", "image"],
    queryFn: () => creatorListAssets({ data: { kind: "image", limit: 24 } }),
  });

  const gen = useMutation({
    mutationFn: () => creatorGenerateImage({ data: { prompt, model: model as any, aspect: aspect as any } }),
    onSuccess: () => { toast.success("Image generated"); setPrompt(""); qc.invalidateQueries({ queryKey: ["creator"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const edit = useMutation({
    mutationFn: () => creatorEditImage({ data: { asset_id: selected!, prompt: editPrompt, model: "google/gemini-3.1-flash-image" as any } }),
    onSuccess: () => { toast.success("Edit created"); setEditPrompt(""); qc.invalidateQueries({ queryKey: ["creator"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="Image Studio" title="Generate and edit images"
        description="Text-to-image, inpainting-style edits, style transfer — all through the Lovable AI Gateway." />

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          <Panel className="p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Generate</div>
            <Hairline className="mb-3" />
            <Textarea rows={4} placeholder="Describe the image…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <div className="mt-3 grid gap-2 grid-cols-2">
              <Select value={aspect} onValueChange={setAspect}>
                <SelectTrigger><SelectValue placeholder="Aspect" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square 1:1</SelectItem>
                  <SelectItem value="portrait">Portrait 2:3</SelectItem>
                  <SelectItem value="landscape">Landscape 3:2</SelectItem>
                  <SelectItem value="wide">Wide 16:9</SelectItem>
                </SelectContent>
              </Select>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="mt-3 w-full" onClick={() => prompt.trim() && gen.mutate()} disabled={!prompt.trim() || gen.isPending}>
              <Sparkles className="h-4 w-4 mr-1" /> {gen.isPending ? "Generating…" : "Generate"}
            </Button>
          </Panel>

          <Panel className="p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Edit selected</div>
            <Hairline className="mb-3" />
            {selected ? (
              <>
                <Input placeholder="Describe the edit…" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} />
                <Button className="mt-3 w-full" variant="outline" disabled={!editPrompt.trim() || edit.isPending}
                  onClick={() => edit.mutate()}>
                  <Wand2 className="h-4 w-4 mr-1" /> {edit.isPending ? "Editing…" : "Apply edit"}
                </Button>
              </>
            ) : (
              <div className="text-[11px] text-soft-gray">Click an image on the right to select it, then describe your edit.</div>
            )}
          </Panel>
        </div>

        <Panel className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Recent images</div>
          <Hairline className="mb-3" />
          {(recent.data ?? []).length === 0 && (
            <div className="text-xs text-soft-gray">No images yet.</div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(recent.data ?? []).map((a) => (
              <button key={a.id} type="button" onClick={() => setSelected(a.id)}
                className={`text-left group rounded-md overflow-hidden border transition-all ${
                  selected === a.id ? "border-gold/60 ring-1 ring-gold/40" : "border-white/5 hover:border-gold/30"
                }`}
              >
                <img src={a.data_url ?? a.external_url ?? ""} alt={a.name} className="w-full aspect-square object-cover" />
                <div className="p-2 text-[11px] text-soft-gray truncate">{a.name}</div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

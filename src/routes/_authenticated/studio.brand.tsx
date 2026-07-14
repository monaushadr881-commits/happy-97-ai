/** /studio/brand — Brand Studio. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { creatorListBrandKits, creatorSaveBrandKit, creatorDeleteBrandKit } from "@/lib/creator-v1.functions";
import { Palette, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio/brand")({
  head: () => ({ meta: [{ title: "Brand Studio — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: BrandStudio,
});

function BrandStudio() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["creator", "brand_kits"], queryFn: () => creatorListBrandKits() });
  const [form, setForm] = useState({
    name: "", primary_color: "#C6A25E", secondary_color: "#0B0B0F",
    accent_color: "#E9E4D8", heading_font: "Playfair Display", body_font: "Inter",
    voice_guide: "",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["creator", "brand_kits"] });
  const save = useMutation({
    mutationFn: () => creatorSaveBrandKit({ data: form }),
    onSuccess: () => { setForm({ ...form, name: "" }); invalidate(); toast.success("Brand kit saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => creatorDeleteBrandKit({ data: { id } }),
    onSuccess: invalidate,
  });

  return (
    <>
      <PageHeader eyebrow="Brand Studio" title="Brand kits" description="Colors, typography and voice guide reused across every studio." />

      <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
        <Panel className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">New brand kit</div>
          <Hairline className="mb-3" />
          <Input placeholder="Brand name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] text-soft-gray">Primary
              <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
            </label>
            <label className="text-[10px] uppercase tracking-[0.15em] text-soft-gray">Secondary
              <Input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} />
            </label>
            <label className="text-[10px] uppercase tracking-[0.15em] text-soft-gray">Accent
              <Input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} />
            </label>
          </div>
          <Input className="mt-2" placeholder="Heading font" value={form.heading_font} onChange={(e) => setForm({ ...form, heading_font: e.target.value })} />
          <Input className="mt-2" placeholder="Body font" value={form.body_font} onChange={(e) => setForm({ ...form, body_font: e.target.value })} />
          <Textarea className="mt-2" rows={4} placeholder="Voice guide — how the brand speaks" value={form.voice_guide} onChange={(e) => setForm({ ...form, voice_guide: e.target.value })} />
          <Button className="mt-3 w-full" onClick={() => form.name.trim() && save.mutate()} disabled={!form.name.trim() || save.isPending}>
            <Palette className="h-4 w-4 mr-1" /> Save brand kit
          </Button>
        </Panel>

        <div className="space-y-3">
          {(q.data ?? []).map((k: any) => (
            <Panel key={k.id} className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-sm text-paper font-medium">{k.name}</div>
                {k.is_default && <Chip tone="gold">Default</Chip>}
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => del.mutate(k.id)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                {[k.primary_color, k.secondary_color, k.accent_color].map((c: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-soft-gray">
                    <span className="h-5 w-5 rounded border border-white/10" style={{ background: c }} />
                    {c}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-soft-gray">
                <span className="text-paper">{k.heading_font}</span> / <span>{k.body_font}</span>
              </div>
              {k.voice_guide && <p className="mt-2 text-xs text-soft-gray">{k.voice_guide}</p>}
            </Panel>
          ))}
          {(q.data ?? []).length === 0 && (
            <Panel className="p-6 text-center text-xs text-soft-gray">No brand kits yet.</Panel>
          )}
        </div>
      </div>
    </>
  );
}

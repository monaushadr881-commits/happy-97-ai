/** /studio/assets — Media Library. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { creatorListAssets, creatorDeleteAsset } from "@/lib/creator-v1.functions";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio/assets")({
  head: () => ({ meta: [{ title: "Media Library — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: AssetsPage,
});

const KINDS = ["all","image","audio","document","slide_deck"] as const;

function AssetsPage() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const q = useQuery({
    queryKey: ["creator", "assets", kind],
    queryFn: () => creatorListAssets({ data: { kind: kind === "all" ? undefined : kind, limit: 100 } }),
  });
  const del = useMutation({
    mutationFn: (id: string) => creatorDeleteAsset({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["creator", "assets"] }); toast.success("Asset removed"); },
  });

  return (
    <>
      <PageHeader eyebrow="Media Library" title="All generated assets"
        description="Every image, audio clip, document and deck HAPPY has produced for you." />

      <Panel className="p-3 mb-4">
        <div className="flex gap-1">
          {KINDS.map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={`rounded px-3 py-1 text-[11px] uppercase tracking-[0.15em] border transition-colors ${
                kind === k ? "bg-gold/10 border-gold/40 text-gold" : "border-white/10 text-soft-gray hover:text-paper"
              }`}
            >{k}</button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {(q.data ?? []).map((a) => (
          <Panel key={a.id} className="p-0 overflow-hidden">
            {a.kind === "image" ? (
              <img src={a.data_url ?? a.external_url ?? ""} alt={a.name} className="w-full aspect-square object-cover" />
            ) : a.kind === "audio" ? (
              <div className="p-3"><audio controls src={a.data_url ?? a.external_url ?? ""} className="w-full" /></div>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-white/[0.02]">
                <Chip tone="neutral">{a.kind}</Chip>
              </div>
            )}
            <div className="p-3">
              <div className="text-xs text-paper truncate">{a.name}</div>
              <div className="text-[10px] text-soft-gray mt-1 truncate">{a.model}</div>
              <Hairline className="my-2" />
              <div className="flex gap-1">
                {(a.data_url || a.external_url) && (
                  <a href={a.data_url ?? a.external_url ?? "#"} download={a.name}>
                    <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
                  </a>
                )}
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => del.mutate(a.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </div>
            </div>
          </Panel>
        ))}
        {(q.data ?? []).length === 0 && (
          <div className="col-span-full text-center text-xs text-soft-gray py-8">No assets yet.</div>
        )}
      </div>
    </>
  );
}

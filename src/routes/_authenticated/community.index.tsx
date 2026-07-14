/** /community — Feed. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Hairline, EmptyState } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { communityFeed, communityCreatePost, communityReact } from "@/lib/cmos-v1.functions";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community/")({
  head: () => ({ meta: [{ title: "Feed — HAPPY X Community" }, { name: "robots", content: "noindex" }] }),
  component: FeedPage,
});

function FeedPage() {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const feed = useQuery({ queryKey: ["cmos", "feed", "public"], queryFn: () => communityFeed({ data: { scope: "public" } }) });
  const create = useMutation({
    mutationFn: (b: string) => communityCreatePost({ data: { body: b, visibility: "public" } }),
    onSuccess: () => { setBody(""); toast.success("Posted"); qc.invalidateQueries({ queryKey: ["cmos", "feed"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const react = useMutation({
    mutationFn: (id: string) => communityReact({ data: { target_type: "post", target_id: id, kind: "like", on: true } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cmos", "feed"] }),
  });

  return (
    <>
      <PageHeader eyebrow="Community" title="Public Feed"
        description="Verified spaces for humans, brands and enterprises. Post, react, discuss — moderated with intelligence." />

      <Panel className="p-5 mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold" /> Share something
        </div>
        <Hairline className="mb-3" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="What's happening in your world?" className="min-h-24 mb-3" />
        <div className="flex justify-end">
          <Button onClick={() => create.mutate(body)} disabled={!body.trim() || create.isPending}>Post</Button>
        </div>
      </Panel>

      <div className="space-y-3">
        {feed.isLoading ? <Panel className="p-6 text-xs text-soft-gray">Loading feed…</Panel>
          : (feed.data?.items ?? []).length === 0
            ? <Panel className="p-8"><EmptyState title="No posts yet" description="Be the first to share." /></Panel>
            : feed.data!.items.map((p: any) => (
              <Panel key={p.id} className="p-5">
                {p.title && <div className="text-sm font-serif text-paper mb-1">{p.title}</div>}
                <div className="text-sm text-paper whitespace-pre-wrap">{p.body}</div>
                <Hairline className="my-3" />
                <div className="flex items-center gap-4 text-xs text-soft-gray">
                  <button onClick={() => react.mutate(p.id)} className="inline-flex items-center gap-1 hover:text-gold">
                    <Heart className="h-3.5 w-3.5" /> {p.reaction_count}
                  </button>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {p.reply_count}</span>
                  <span className="ml-auto">{new Date(p.created_at).toLocaleString()}</span>
                </div>
              </Panel>
            ))}
      </div>
    </>
  );
}

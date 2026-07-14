/** /education/certificates — earned certificates. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { supabase } from "@/integrations/supabase/client";
import { Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/education/certificates")({
  head: () => ({ meta: [{ title: "Certificates — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Certificates,
});

type Cert = { id: string; serial: string; issued_at: string; course_id: string | null; courses: { title: string } | null };

function Certificates() {
  const q = useQuery({
    queryKey: ["edu", "certificates"],
    queryFn: async () => {
      const r = await supabase.from("certificates")
        .select("id, serial, issued_at, course_id, courses:course_id(title)")
        .order("issued_at", { ascending: false }).limit(60);
      if (r.error) throw new Error(r.error.message);
      return r.data ?? [];
    },
  });
  const list = ((q.data ?? []) as unknown as Cert[]);
  return (
    <>
      <PageHeader eyebrow="Education OS" title="Certificates" description="Every course you've completed, issued by HAPPY X." />
      {list.length ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Panel key={c.id} className="p-5">
              <Award className="h-8 w-8 text-gold" />
              <div className="mt-3 text-sm text-paper">{c.courses?.title ?? "Certificate"}</div>
              <div className="mt-1 text-[11px] text-soft-gray">Serial {c.serial}</div>
              <Hairline className="my-3" />
              <div className="text-[11px] text-soft-gray">Issued {new Date(c.issued_at).toLocaleDateString()}</div>
            </Panel>
          ))}
        </div>
      ) : <Panel className="p-6 text-sm text-soft-gray">No certificates yet.</Panel>}
    </>
  );
}

/** /hyperlocal/settings — privacy & location preferences (opt-in). */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { hlGetMyLocation, hlSetMyLocation } from "@/lib/hyperlocal-v1.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hyperlocal/settings")({
  head: () => ({ meta: [{ title: "Hyperlocal Privacy — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  const loc = useQuery({ queryKey: ["hl", "me-loc"], queryFn: () => hlGetMyLocation() });

  const [allowPrecise, setAllowPrecise] = useState(false);
  const [allowBg, setAllowBg] = useState(false);
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    if (loc.data) {
      setAllowPrecise(loc.data.allow_precise);
      setAllowBg(loc.data.allow_background);
      setCity(loc.data.city ?? "");
      setPincode(loc.data.pincode ?? "");
      setLat(loc.data.last_latitude ?? null);
      setLng(loc.data.last_longitude ?? null);
    }
  }, [loc.data]);

  const save = useMutation({
    mutationFn: () => hlSetMyLocation({ data: {
      allow_precise: allowPrecise, allow_background: allowBg,
      city: city || undefined, pincode: pincode || undefined,
      latitude: allowPrecise && lat != null ? lat : undefined,
      longitude: allowPrecise && lng != null ? lng : undefined,
    } }),
    onSuccess: () => { toast.success("Privacy preferences saved"); qc.invalidateQueries({ queryKey: ["hl", "me-loc"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const capture = () => {
    if (!allowPrecise) { toast.error("Enable precise location first"); return; }
    if (!("geolocation" in navigator)) { toast.error("Geolocation not available"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); toast.success("Location captured"); },
      (err) => toast.error(err.message),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="Location preferences"
        description="Precise location is always opt-in. Background location requires explicit permission. You can disable both at any time."
      />

      <Panel className="p-5 mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Consent</div>
        <Hairline className="mb-4" />
        <div className="grid gap-4">
          <label className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-paper">Allow precise location</div>
              <div className="text-[11px] text-soft-gray">Enables radius-based search and directions. Nothing is stored without this.</div>
            </div>
            <Switch checked={allowPrecise} onCheckedChange={setAllowPrecise} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-paper">Allow background location</div>
              <div className="text-[11px] text-soft-gray">Required for background alerts. HAPPY never tracks continuously.</div>
            </div>
            <Switch checked={allowBg} onCheckedChange={setAllowBg} disabled={!allowPrecise} />
          </label>
        </div>
      </Panel>

      <Panel className="p-5 mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Area</div>
        <Hairline className="mb-4" />
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={capture} disabled={!allowPrecise}>Capture precise location</Button>
          {lat != null && lng != null && allowPrecise && (
            <span className="text-[11px] text-soft-gray">lat {lat.toFixed(4)}, lng {lng.toFixed(4)}</span>
          )}
        </div>
      </Panel>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Save preferences</Button>
      </div>
    </>
  );
}

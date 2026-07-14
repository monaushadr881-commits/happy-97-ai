/** /digital-human/settings — voice, accessibility, memory, consent. */
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDigitalHuman, type DhPreferences } from "@/components/digital-human/DigitalHumanContext";

export const Route = createFileRoute("/_authenticated/digital-human/settings")({
  head: () => ({ meta: [{ title: "Settings — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: Settings,
});

const VOICES = [
  ["alloy", "Alloy"], ["ash", "Ash"], ["ballad", "Ballad"], ["coral", "Coral"],
  ["echo", "Echo"], ["sage", "Sage"], ["shimmer", "Shimmer"], ["verse", "Verse"],
] as const;

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <div className="text-sm text-paper">{label}</div>
        {hint && <div className="text-[11px] text-soft-gray mt-0.5">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Settings() {
  const { prefs, updatePrefs } = useDigitalHuman();
  const set = (k: keyof DhPreferences, v: unknown) => updatePrefs({ [k]: v } as Partial<DhPreferences>);

  return (
    <>
      <PageHeader eyebrow="Digital Human OS" title="HAPPY Settings"
        description="Voice, accessibility, memory and consent. Every setting stays private to your account." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm uppercase tracking-[0.18em] text-paper">Voice</h2>
          <Hairline className="my-3" />
          <Row label="Voice">
            <Select value={prefs.voice} onValueChange={(v) => set("voice", v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{VOICES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Row>
          <Row label="Speed" hint={`${prefs.speed.toFixed(2)}×`}>
            <div className="w-40">
              <Slider min={0.5} max={2} step={0.05} value={[prefs.speed]} onValueChange={(v) => set("speed", v[0])} />
            </div>
          </Row>
          <Row label="Mute voice" hint="Use captions only.">
            <Switch checked={prefs.mute_audio} onCheckedChange={(v) => set("mute_audio", v)} />
          </Row>
          <Row label="Language" hint="HAPPY responds in this language.">
            <Select value={prefs.language} onValueChange={(v) => set("language", v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["en", "hi", "es", "fr", "de", "ar", "zh", "ja", "pt"].map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </Row>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm uppercase tracking-[0.18em] text-paper">Accessibility</h2>
          <Hairline className="my-3" />
          <Row label="Captions" hint="Show subtitles for every HAPPY reply.">
            <Switch checked={prefs.captions} onCheckedChange={(v) => set("captions", v)} />
          </Row>
          <Row label="Reduced motion" hint="Disables blinking, breathing and pulse.">
            <Switch checked={prefs.reduced_motion} onCheckedChange={(v) => set("reduced_motion", v)} />
          </Row>
          <Row label="High contrast" hint="Adds a stronger outline to conversation panels.">
            <Switch checked={prefs.high_contrast} onCheckedChange={(v) => set("high_contrast", v)} />
          </Row>
          <Row label="Large text" hint="Increases caption font size.">
            <Switch checked={prefs.large_text} onCheckedChange={(v) => set("large_text", v)} />
          </Row>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm uppercase tracking-[0.18em] text-paper">Memory</h2>
          <Hairline className="my-3" />
          <Row label="Conversation memory" hint="HAPPY remembers recent turns of the same session.">
            <Switch checked={prefs.memory_enabled} onCheckedChange={(v) => set("memory_enabled", v)} />
          </Row>
          <Row label="Emotion adaptation" hint="Opt-in: HAPPY may soften tone. Never claims certainty about your state.">
            <Switch checked={prefs.emotion_adaptation} onCheckedChange={(v) => set("emotion_adaptation", v)} />
          </Row>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm uppercase tracking-[0.18em] text-paper">Consent</h2>
          <Hairline className="my-3" />
          <Label className="text-[11px] text-soft-gray">
            HAPPY never records without explicit consent. No biometric identification. No hidden background processing.
          </Label>
          <Row label="Camera consent" hint="Grants opt-in access to your camera for supported flows.">
            <Switch checked={prefs.camera_consent} onCheckedChange={(v) => set("camera_consent", v)} />
          </Row>
          <Row label="Microphone consent" hint="Grants opt-in access to your microphone for supported flows.">
            <Switch checked={prefs.microphone_consent} onCheckedChange={(v) => set("microphone_consent", v)} />
          </Row>
        </Panel>
      </div>
    </>
  );
}

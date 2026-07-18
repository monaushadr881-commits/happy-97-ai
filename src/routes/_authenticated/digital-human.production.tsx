/**
 * /digital-human/production — R143 Digital Human Production Experience.
 *
 * Pure UI extension over canonical owners:
 *  • HappyVRM / HappyAvatar / conversation-engine / useHappySpeech
 *  • happy-cinematic/* (choreography, camera)
 *  • happy-r117/dh-intelligence (relationship, environment, entry)
 *  • happy-r143/dh-production   (BMW M5 entry, anim catalogue, camera modes,
 *                                environments, voice experience, relationship
 *                                behaviours, presentation modes)
 *
 * No new VRM. No new speech runtime. No new animation engine.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import {
  planBmwM5Entry, animationFor, environmentPreset, ENVIRONMENT_SCENES,
  cameraMode, CAMERA_MODES, voiceExperience, relationshipBehaviour,
  RELATIONSHIP_ROLES, planPresentation, PRESENTATION_MODES, ANIMATION_CATALOGUE,
  productionFrame,
  type RelationshipRole, type PresentationMode, type CameraMode,
} from "@/lib/happy-r143/dh-production";
import type { EnvironmentScene } from "@/lib/happy-r117/dh-intelligence";
import type { Intent } from "@/components/digital-human/conversation-engine";

export const Route = createFileRoute("/_authenticated/digital-human/production")({
  head: () => ({ meta: [
    { title: "HAPPY Digital Human — Production Experience" },
    { name: "description", content: "Founder-approved Digital Human production studio: cinematic entry, camera modes, environments, voice, and presentation surfaces." },
    { name: "robots", content: "noindex" },
  ]}),
  component: ProductionExperience,
});

const INTENTS: Intent[] = ["greeting", "teaching", "warning", "congrats", "complex", "general"];

function ProductionExperience() {
  const [role, setRole] = useState<RelationshipRole>("founder");
  const [scene, setScene] = useState<EnvironmentScene>("board_room");
  const [intent, setIntent] = useState<Intent>("teaching");
  const [presentation, setPresentation] = useState<PresentationMode | null>("slides");
  const [mode, setMode] = useState<CameraMode | undefined>(undefined);
  const [entry, setEntry] = useState<"bmw_m5" | null>("bmw_m5");
  const [reducedMotion, setReducedMotion] = useState(false);

  const frame = useMemo(() => productionFrame({
    role, intent, scene,
    behaviour: intent === "warning" ? "concern"
      : intent === "congrats" ? "celebration"
      : intent === "teaching" ? "explanation"
      : intent === "greeting" ? "agreement"
      : "talking",
    presentationMode: presentation,
    entry, reducedMotion,
  }), [role, intent, scene, presentation, entry, reducedMotion]);

  const bmw = useMemo(() => planBmwM5Entry(reducedMotion), [reducedMotion]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="R143"
        title="Digital Human Production Experience"
        description="Founder-approved cinematic runtime. Extends canonical HAPPY — no duplicate VRM, no duplicate speech engine."
      />

      <Panel title="Cast">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PickerGroup label="Relationship role" value={role} onChange={setRole} options={RELATIONSHIP_ROLES} />
          <PickerGroup label="Environment" value={scene} onChange={setScene} options={ENVIRONMENT_SCENES} />
          <PickerGroup label="Intent" value={intent} onChange={setIntent} options={INTENTS} />
        </div>
        <Hairline />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PickerGroup
            label="Presentation mode"
            value={presentation ?? "none"}
            onChange={(v) => setPresentation(v === "none" ? null : (v as PresentationMode))}
            options={["none", ...PRESENTATION_MODES]}
          />
          <PickerGroup
            label="Camera override"
            value={mode ?? "auto"}
            onChange={(v) => setMode(v === "auto" ? undefined : (v as CameraMode))}
            options={["auto", ...CAMERA_MODES]}
          />
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Options</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={entry === "bmw_m5" ? "default" : "outline"}
                onClick={() => setEntry(entry === "bmw_m5" ? null : "bmw_m5")}>
                BMW M5 Entry
              </Button>
              <Button size="sm" variant={reducedMotion ? "default" : "outline"}
                onClick={() => setReducedMotion((v) => !v)}>
                Reduced motion
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="BMW M5 Cinematic Entry">
          <div className="text-xs text-soft-gray">Total {bmw.totalMs} ms · {bmw.beats.length} beats · reducedMotion={String(bmw.reducedMotion)}</div>
          <ol className="mt-3 space-y-1 text-sm">
            {bmw.beats.map((b, i) => (
              <li key={b} className="flex items-center gap-2">
                <span className="w-6 text-right text-xs text-soft-gray">{i + 1}.</span>
                <Chip>{b}</Chip>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Live Production Frame">
          <dl className="space-y-2 text-sm">
            <Row k="Animation" v={`${frame.animation.clip}${frame.animation.loop ? " · loop" : ""}`} />
            <Row k="Environment" v={`${frame.environment.scene} · ${frame.environment.floor} · ${frame.environment.lighting}`} />
            <Row k="Camera" v={`${frame.camera.mode} → ${frame.camera.followSubject} (lerp ${frame.camera.lerp})`} />
            <Row k="Voice" v={`${frame.voice.emotion} · ${frame.voice.flow} · pitch ${frame.voice.pitch.toFixed(2)} · rate ${frame.voice.rate.toFixed(2)}`} />
            <Row k="Behaviour" v={`${frame.behaviour.role} · ${frame.behaviour.formality} · warmth ${frame.behaviour.warmth}`} />
            <Row k="Presentation" v={frame.presentation ? `${frame.presentation.mode} on ${frame.presentation.surface}` : "—"} />
            <Row k="Entry" v={frame.entry ? `${frame.entry.variant} · ${frame.entry.totalMs} ms` : "—"} />
          </dl>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Animation Catalogue (20)">
          <div className="flex flex-wrap gap-1.5">
            {ANIMATION_CATALOGUE.map((c) => (
              <Chip key={c} tone={c === frame.animation.clip ? "gold" : "default"}>{c}</Chip>
            ))}
          </div>
        </Panel>
        <Panel title="Environments (7)">
          <div className="flex flex-wrap gap-1.5">
            {ENVIRONMENT_SCENES.map((s) => {
              const p = environmentPreset(s);
              return (
                <Chip key={s} tone={s === scene ? "gold" : "default"}>{p.scene}</Chip>
              );
            })}
          </div>
        </Panel>
        <Panel title="Camera Modes (5)">
          <div className="flex flex-wrap gap-1.5">
            {CAMERA_MODES.map((m) => {
              const p = cameraMode({ mode: m });
              return (
                <Chip key={m} tone={m === frame.camera.mode ? "gold" : "default"}>
                  {m} → {p.scene}
                </Chip>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Relationship Behaviours (7)">
          <div className="space-y-1 text-xs">
            {RELATIONSHIP_ROLES.map((r) => {
              const b = relationshipBehaviour(r);
              return (
                <div key={r} className="flex items-center justify-between">
                  <span className={r === role ? "text-gold" : "text-paper"}>{r}</span>
                  <span className="text-soft-gray">
                    {b.formality} · {b.cameraMode} · {b.greetingStyle} · mem:{b.memoryDepth}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Voice Experience Preview">
          <div className="space-y-1 text-xs">
            {INTENTS.map((i) => {
              const v = voiceExperience(i, relationshipBehaviour(role).tier);
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className={i === intent ? "text-gold" : "text-paper"}>{i}</span>
                  <span className="text-soft-gray">
                    {v.emotion} · {v.flow} · pitch {v.pitch.toFixed(2)} · pause {v.pauseMs}ms
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="Presentation Modes (6)">
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
          {PRESENTATION_MODES.map((m) => {
            const p = planPresentation(m, relationshipBehaviour(role).tier);
            return (
              <div key={m} className={`rounded border px-3 py-2 ${m === presentation ? "border-gold/60 bg-gold/5" : "border-white/5"}`}>
                <div className="text-paper">{m}</div>
                <div className="text-soft-gray">{p.surface} · {p.cameraMode} · {p.animation}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <p className="text-xs text-soft-gray">
        Canonical owners: HappyVRM · HappyAvatar · conversation-engine · useHappySpeech · happy-cinematic · happy-r117 · happy-r143.
        Remaining external deps: BMW M5 mesh, VRM clips for full 20-animation catalogue, HDRI skyboxes per environment.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs uppercase tracking-[0.18em] text-soft-gray">{k}</dt>
      <dd className="text-right text-sm text-paper">{v}</dd>
    </div>
  );
}

function PickerGroup<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-[0.2em] text-soft-gray">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)}
            className={`rounded border px-2 py-1 text-xs transition-colors ${
              o === value ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-soft-gray hover:text-paper"
            }`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

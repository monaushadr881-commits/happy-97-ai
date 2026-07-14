/** /digital-human/whiteboard — solo whiteboard workspace with HAPPY beside it. */
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Chip } from "@/design-system/primitives";
import { HappyAvatar } from "@/components/digital-human/HappyAvatar";
import { Whiteboard } from "@/components/digital-human/Whiteboard";
import { useDigitalHuman } from "@/components/digital-human/DigitalHumanContext";

export const Route = createFileRoute("/_authenticated/digital-human/whiteboard")({
  head: () => ({ meta: [{ title: "Whiteboard — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: Board,
});

function Board() {
  const { prefs, expression, activity, gazeTarget } = useDigitalHuman();
  return (
    <>
      <PageHeader eyebrow="Digital Human OS" title="Interactive Whiteboard"
        description="Sketch diagrams, code, math, and business models. HAPPY watches and can explain what you draw." />
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Panel className="p-5 flex flex-col items-center">
          <HappyAvatar
            expression={expression}
            activity={activity}
            reducedMotion={prefs.reduced_motion}
            size={180}
            gazeTarget={gazeTarget}
          />
          <Chip tone="gold" className="mt-3">HAPPY</Chip>
          <p className="mt-3 text-[11px] text-soft-gray text-center">
            HAPPY glances toward what you draw, then returns to you.
          </p>
        </Panel>
        <Whiteboard height={560} />
      </div>
    </>
  );
}

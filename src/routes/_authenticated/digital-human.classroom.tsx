/** /digital-human/classroom — HAPPY teaches with whiteboard + voice. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HappyAvatar } from "@/components/digital-human/HappyAvatar";
import { Whiteboard } from "@/components/digital-human/Whiteboard";
import { useDigitalHuman } from "@/components/digital-human/DigitalHumanContext";
import { useHappySpeech } from "@/components/digital-human/useHappySpeech";
import { dhSpeak } from "@/lib/digital-human-v1.functions";
import { Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/digital-human/classroom")({
  head: () => ({ meta: [{ title: "Classroom — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: Classroom,
});

function Classroom() {
  const { prefs, expression, activity, setActivity, setExpression } = useDigitalHuman();
  const { speak } = useHappySpeech();
  const [topic, setTopic] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  const teach = useMutation({
    mutationFn: () => dhSpeak({ data: { mode: "teacher", surface: "classroom", session_id: sessionId, message: topic } }),
    onMutate: () => { setActivity("listening"); setExpression("thinking"); },
    onSuccess: async (res) => {
      setSessionId(res.session_id);
      setAnswer(res.answer);
      setExpression("explain");
      if (!prefs.mute_audio) {
        setActivity("speaking");
        await speak(res.answer, { voice: prefs.voice, speed: prefs.speed, onEnd: () => { setActivity("idle"); setExpression("neutral"); } });
      } else setActivity("idle");
    },
    onError: (e: Error) => { toast.error(e.message); setActivity("idle"); },
  });

  return (
    <>
      <PageHeader eyebrow="Digital Human OS" title="HAPPY Classroom"
        description="HAPPY teaches at the whiteboard — voice, gestures and diagrams synchronized." />
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Panel className="p-5 flex flex-col items-center">
          <HappyAvatar expression={expression} activity={activity} reducedMotion={prefs.reduced_motion} size={200} />
          <Chip tone="gold" className="mt-3">HAPPY · Teacher</Chip>
        </Panel>
        <div className="space-y-4">
          <Panel className="p-4">
            <div className="flex gap-2">
              <Textarea rows={2} value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="What should HAPPY teach today?" />
              <Button onClick={() => topic.trim() && teach.mutate()} disabled={teach.isPending || !topic.trim()}>
                <Send className="h-4 w-4 mr-1" /> {teach.isPending ? "Preparing…" : "Teach"}
              </Button>
            </div>
            {answer && prefs.captions && (
              <>
                <Hairline className="my-3" />
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{answer}</ReactMarkdown>
                </div>
              </>
            )}
          </Panel>
          <Whiteboard height={420} />
        </div>
      </div>
    </>
  );
}

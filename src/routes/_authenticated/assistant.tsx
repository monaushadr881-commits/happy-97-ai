import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { sendChatMessage } from "@/lib/happyx-chat.functions";
import { Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { HappyUniversalActionBar } from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [{ title: "HAPPY AI Assistant" }, { name: "robots", content: "noindex" }],
  }),
  component: AssistantPage,
});

type Message = { role: "user" | "assistant"; content: string };

function AssistantPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: (message: string) =>
      sendChatMessage({ data: { conversationId, message } }),
    onSuccess: (res) => {
      setConversationId(res.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setMessages((m) => m.slice(0, -1));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || mutation.isPending) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    mutation.mutate(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="border-b border-white/5 px-6 lg:px-10 py-6">
        <p className="eyebrow mb-2">HAPPY AI</p>
        <h1 className="font-display text-2xl tracking-tight">Assistant</h1>
        <p className="text-xs text-soft-gray mt-1">
          Human-centered intelligence. Ask anything — from strategy to code to culture.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 lg:px-10 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && <EmptyState onPick={(q) => { setInput(q); }} />}
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {mutation.isPending && (
            <MessageBubble role="assistant" content="…" pending />
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-white/5 px-6 lg:px-10 py-4 bg-obsidian"
      >
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder="Message HAPPY…"
            className="flex-1 resize-none rounded-2xl bg-charcoal border border-white/10 px-5 py-3 text-sm placeholder:text-soft-gray/60 focus:outline-none focus:border-gold/50 max-h-40"
          />
          <button
            type="submit"
            disabled={mutation.isPending || !input.trim()}
            className="h-11 w-11 shrink-0 rounded-full bg-gold text-obsidian flex items-center justify-center hover:bg-gold-bright disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  pending,
}: {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${
          isUser ? "bg-white/5 text-paper" : "bg-gold/10 text-gold"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser ? "bg-gold text-obsidian" : "bg-charcoal border border-white/5 text-paper"
        } ${pending ? "animate-pulse" : ""}`}
      >
        {content}
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const prompts = [
    "Draft a Q1 strategy memo for a luxury AI platform",
    "Explain relativity like I'm a curious 12-year-old",
    "Design a 7-day launch plan for our new module",
    "Review this pitch and sharpen the hook",
  ];
  return (
    <div className="text-center py-16">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-gold to-gold-deep flex items-center justify-center text-obsidian mb-6">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="font-display text-2xl tracking-tight">How can I help today?</h2>
      <p className="mt-2 text-sm text-soft-gray max-w-md mx-auto">
        HAPPY brings reasoning, memory, and human warmth to every conversation.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="rounded-xl border border-white/5 bg-charcoal p-4 text-sm text-soft-gray hover:border-gold/30 hover:text-paper transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

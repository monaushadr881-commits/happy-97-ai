/**
 * HAPPY X — Founder Command Palette + Voice Router.
 * Cmd/Ctrl+K opens a universal search + quick-action dispatcher.
 * A microphone button starts voice input; the utterance is matched to a
 * navigation command and executed exactly like a keyboard shortcut.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Users,
  Sparkles,
  Activity,
  Shield,
  Settings2,
  BarChart3,
  MessageSquare,
  Search,
  Mic,
  MicOff,
  Bot,
  GraduationCap,
  Palette,
  BookOpen,
  Store,
  MapPin,
  Presentation,
  PenLine,
} from "lucide-react";
import { apiListCompanies, apiSearchKnowledge } from "@/lib/api-v1.functions";
import { useVoiceInput } from "@/components/digital-human/useVoiceInput";
import { toast } from "sonner";

const NAV = [
  { label: "Overview", to: "/founder", icon: LayoutDashboard },
  { label: "Companies", to: "/founder/companies", icon: Building2 },
  { label: "Users & Access", to: "/founder/users", icon: Users },
  { label: "AI Management", to: "/founder/ai", icon: Sparkles },
  { label: "Operations", to: "/founder/ops", icon: Activity },
  { label: "Security", to: "/founder/security", icon: Shield },
  { label: "Analytics", to: "/founder/analytics", icon: BarChart3 },
  { label: "System", to: "/founder/system", icon: Settings2 },
  { label: "Founder AI", to: "/assistant", icon: MessageSquare },
] as const;

/**
 * Voice command grammar. `keywords` are matched (case-insensitive) as any-of.
 * Order matters: more specific commands first.
 */
type VoiceCmd = { keywords: string[]; to: string; label: string; icon: typeof Bot };
const VOICE_COMMANDS: VoiceCmd[] = [
  { keywords: ["presentation mode", "start presentation", "open presentation"], to: "/digital-human/presentation", label: "Presentation Mode", icon: Presentation },
  { keywords: ["start whiteboard", "open whiteboard", "whiteboard"], to: "/digital-human/whiteboard", label: "Whiteboard", icon: PenLine },
  { keywords: ["open digital human", "open happy", "talk to happy"], to: "/digital-human", label: "Digital Human", icon: Bot },
  { keywords: ["open business", "open business os", "business os"], to: "/business", label: "Business OS", icon: Building2 },
  { keywords: ["open education", "open education os", "learn"], to: "/education", label: "Education OS", icon: GraduationCap },
  { keywords: ["open studio", "open creator", "creator studio"], to: "/studio", label: "Creator Studio", icon: Palette },
  { keywords: ["open enterprise"], to: "/enterprise", label: "Enterprise", icon: Shield },
  { keywords: ["search knowledge", "open knowledge", "knowledge"], to: "/knowledge", label: "Knowledge", icon: BookOpen },
  { keywords: ["open community"], to: "/community", label: "Community", icon: Users },
  { keywords: ["open marketplace"], to: "/marketplace", label: "Marketplace", icon: Store },
  { keywords: ["open hyperlocal", "hyperlocal"], to: "/hyperlocal", label: "Hyperlocal", icon: MapPin },
  { keywords: ["open founder dashboard", "founder dashboard", "founder"], to: "/founder", label: "Founder Dashboard", icon: LayoutDashboard },
  { keywords: ["open operations", "operations dashboard", "monitoring"], to: "/founder/ops", label: "Operations", icon: Activity },
  { keywords: ["open dashboard", "dashboard"], to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { keywords: ["create note", "new note", "open notes"], to: "/education/notes", label: "Notes", icon: PenLine },
  { keywords: ["open assistant", "founder ai"], to: "/assistant", label: "Assistant", icon: MessageSquare },
  { keywords: ["open trust", "trust center"], to: "/trust", label: "Trust Center", icon: Shield },
  { keywords: ["open status", "status center", "system status"], to: "/status", label: "Status", icon: Activity },
];

function matchVoiceCommand(utterance: string): VoiceCmd | null {
  const u = utterance.toLowerCase();
  for (const cmd of VOICE_COMMANDS) {
    if (cmd.keywords.some((k) => u.includes(k))) return cmd;
  }
  return null;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [voiceHint, setVoiceHint] = useState<string>("");
  const [voiceOn, setVoiceOn] = useState(false);
  const navigate = useNavigate();
  const closingRef = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback((to: string) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpen(false);
    setVoiceOn(false);
    navigate({ to });
    setTimeout(() => { closingRef.current = false; }, 200);
  }, [navigate]);

  const voice = useVoiceInput({
    lang: "en-US",
    onTranscript: (text, isFinal) => {
      setVoiceHint(text);
      if (!isFinal) return;
      const cmd = matchVoiceCommand(text);
      if (cmd) {
        toast.success(`Voice: ${cmd.label}`);
        setVoiceOn(false);
        go(cmd.to);
      } else {
        setQuery(text);
      }
    },
  });

  useEffect(() => {
    if (voiceOn) voice.start().catch((e: Error) => { toast.error(e.message); setVoiceOn(false); });
    else voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOn]);

  useEffect(() => {
    if (!open) { setVoiceOn(false); setVoiceHint(""); }
  }, [open]);

  const companies = useQuery({
    queryKey: ["founder", "cmd", "companies"],
    queryFn: () => apiListCompanies(),
    enabled: open,
    staleTime: 30_000,
  });

  const knowledge = useQuery({
    queryKey: ["founder", "cmd", "knowledge", query],
    queryFn: () => apiSearchKnowledge({ data: { q: query, limit: 5 } }),
    enabled: open && query.length > 1,
  });

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2 border-b border-white/5 px-3 pt-1">
        <CommandInput
          className="flex-1"
          placeholder={voiceOn ? "Listening… say “open business” or “start whiteboard”" : "Search entities, jump to a page, or press mic to speak…"}
          value={query}
          onValueChange={setQuery}
        />
        <Button
          size="sm"
          variant={voiceOn ? "default" : "outline"}
          onClick={() => setVoiceOn((v) => !v)}
          disabled={!voice.supported.dictation}
          aria-label={voiceOn ? "Stop voice input" : "Start voice input"}
          className="my-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
        >
          {voiceOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
      </div>
      {voiceOn && voiceHint && (
        <div className="px-4 py-1 text-[11px] text-soft-gray italic border-b border-white/5">
          Heard: “{voiceHint}”…
        </div>
      )}
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {NAV.map((n) => (
            <CommandItem key={n.to} onSelect={() => go(n.to)}>
              <n.icon className="mr-2 h-4 w-4 text-gold/80" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Voice commands">
          {VOICE_COMMANDS.slice(0, 8).map((c) => (
            <CommandItem key={c.to + c.label} onSelect={() => go(c.to)}>
              <c.icon className="mr-2 h-4 w-4 text-gold/80" />
              <span className="flex-1">{c.label}</span>
              <span className="ml-2 text-[10px] uppercase tracking-widest text-soft-gray">“{c.keywords[0]}”</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {Array.isArray(companies.data) && companies.data.length > 0 && (
          <CommandGroup heading="Companies">
            {(companies.data as Array<{ id: string; display_name?: string; legal_name?: string; slug?: string }>).slice(0, 6).map((c) => (
              <CommandItem
                key={c.id}
                onSelect={() => go(`/founder/companies`)}
              >
                <Building2 className="mr-2 h-4 w-4 text-gold/80" />
                {c.display_name ?? c.legal_name ?? c.slug ?? c.id}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {knowledge.data && Array.isArray(knowledge.data) && knowledge.data.length > 0 && (
          <CommandGroup heading="Knowledge">
            {(knowledge.data as Array<{ id: string; title: string }>).map((k) => (
              <CommandItem key={k.id} onSelect={() => go(`/knowledge`)}>
                <Search className="mr-2 h-4 w-4 text-gold/80" />
                {k.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

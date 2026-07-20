/**
 * HappyUniversalPromptBar — the ONE canonical AI Prompt Composer.
 *
 * Single, reusable prompt composer for every AI surface across HAPPY X:
 * Assistant, Knowledge, Workspace, Creator Studio, Publishing,
 * Automation, Mission Control, Business, Memory, Experience,
 * Digital Human, Universal Search, Communication.
 *
 * NO other prompt composer may exist. Extend via props — do NOT fork.
 *
 * Canonical owners reused (not duplicated):
 *  - Design tokens: @/design-system + Tailwind semantic tokens
 *  - shadcn/ui primitives: Button, Textarea, Tabs, DropdownMenu,
 *    Popover, Dialog, Tooltip, Badge, ScrollArea, Separator, Input
 *  - Toasts: sonner (mounted once in __root)
 *  - Action bar: HappyUniversalActionBar (for output messages)
 *  - Runtimes (invoked by parent via onSend / onAction intents):
 *    Assistant, Knowledge, Workspace, Creator, Publishing,
 *    Communication, Digital Human, Mission Control, Automation,
 *    Universal Search, Memory, Experience, Business —
 *    all through their canonical server-fn owners; this composer
 *    only DISPATCHES intents.
 */
import * as React from "react";
import {
  Paperclip,
  Mic,
  Send,
  Settings2,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  Copy,
  Save,
  History,
  Star,
  FolderOpen,
  FileText,
  Share2,
  Trash2,
  Download,
  Undo2,
  Redo2,
  Wand2,
  Bug,
  Search,
  Zap,
  RefreshCcw,
  Languages,
  BookOpen,
  ListTree,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  Music,
  Video as VideoIcon,
  Github,
  Link2,
  Folder,
  Variable,
  Pin,
  X,
  Code2,
  Braces,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────
// Canonical taxonomies — extend here only.
// ────────────────────────────────────────────────────────────────

export type HuppSurface =
  | "fullstack-app"
  | "mobile-app"
  | "landing-page"
  | "website"
  | "ai-agent"
  | "prompt"
  | "code"
  | "database"
  | "api"
  | "uiux"
  | "presentation"
  | "document"
  | "excel"
  | "image"
  | "video"
  | "voice"
  | "digital-human"
  | "automation"
  | "research"
  | "chat";

export type HuppModel =
  | "auto"
  | "gpt"
  | "gemini"
  | "claude"
  | "deepseek"
  | "grok"
  | "local";

export type HuppMode =
  | "build"
  | "generate"
  | "debug"
  | "review"
  | "optimize"
  | "research"
  | "explain"
  | "summarize"
  | "translate"
  | "continue"
  | "refactor"
  | "analyze";

export type HuppVisibility = "private" | "workspace" | "public";

export type HuppAttachmentKind =
  | "image"
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "zip"
  | "audio"
  | "video"
  | "github"
  | "git-url"
  | "website-url"
  | "folder";

export interface HuppAttachment {
  id: string;
  kind: HuppAttachmentKind;
  name: string;
  size?: number;
  url?: string;
}

export interface HuppSendPayload {
  prompt: string;
  surface: HuppSurface;
  mode: HuppMode;
  model: HuppModel;
  visibility: HuppVisibility;
  attachments: HuppAttachment[];
  variables: Record<string, string>;
}

export type HuppActionIntent =
  | "copy"
  | "copy-markdown"
  | "copy-html"
  | "copy-json"
  | "copy-yaml"
  | "copy-prompt"
  | "save-prompt"
  | "save-draft"
  | "open-history"
  | "open-favorites"
  | "open-collections"
  | "open-templates"
  | "open-pinned"
  | "open-variables"
  | "share"
  | "delete"
  | "duplicate"
  | "export-txt"
  | "export-md"
  | "export-pdf"
  | "export-docx"
  | "export-html"
  | "export-json"
  | "export-yaml"
  | "export-csv"
  | "export-clipboard";

export interface HappyUniversalPromptBarProps {
  /** Initial prompt value (uncontrolled). */
  defaultValue?: string;
  /** Controlled value. */
  value?: string;
  onValueChange?: (value: string) => void;

  /** Default surface tab shown; falls back to "chat". */
  defaultSurface?: HuppSurface;
  /** Restrict which surface tabs are shown. */
  surfaces?: HuppSurface[];

  defaultMode?: HuppMode;
  defaultModel?: HuppModel;
  defaultVisibility?: HuppVisibility;

  placeholder?: string;
  disabled?: boolean;
  busy?: boolean;

  /** localStorage key for auto-save draft. Set to null to disable. */
  draftKey?: string | null;

  /** Called on Send / Ctrl+Enter. */
  onSend?: (payload: HuppSendPayload) => void | Promise<void>;
  /** Called for every quick action / export intent. */
  onAction?: (intent: HuppActionIntent, payload: HuppSendPayload) => void | Promise<void>;
  /** Voice capture toggled. Parent owns capture pipeline. */
  onVoiceToggle?: (active: boolean) => void;

  className?: string;
}

// ────────────────────────────────────────────────────────────────
// Labels
// ────────────────────────────────────────────────────────────────

const SURFACES: { id: HuppSurface; label: string }[] = [
  { id: "fullstack-app", label: "Full Stack" },
  { id: "mobile-app", label: "Mobile" },
  { id: "landing-page", label: "Landing" },
  { id: "website", label: "Website" },
  { id: "ai-agent", label: "AI Agent" },
  { id: "prompt", label: "Prompt" },
  { id: "code", label: "Code" },
  { id: "database", label: "Database" },
  { id: "api", label: "API" },
  { id: "uiux", label: "UI/UX" },
  { id: "presentation", label: "Presentation" },
  { id: "document", label: "Document" },
  { id: "excel", label: "Excel" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "voice", label: "Voice" },
  { id: "digital-human", label: "Digital Human" },
  { id: "automation", label: "Automation" },
  { id: "research", label: "Research" },
  { id: "chat", label: "Chat" },
];

const MODELS: { id: HuppModel; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "gpt", label: "GPT" },
  { id: "gemini", label: "Gemini" },
  { id: "claude", label: "Claude" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "grok", label: "Grok" },
  { id: "local", label: "Local LLM" },
];

const MODES: { id: HuppMode; label: string; icon: React.ReactNode }[] = [
  { id: "build", label: "Build", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: "generate", label: "Generate", icon: <Wand2 className="h-3.5 w-3.5" /> },
  { id: "debug", label: "Debug", icon: <Bug className="h-3.5 w-3.5" /> },
  { id: "review", label: "Review", icon: <Eye className="h-3.5 w-3.5" /> },
  { id: "optimize", label: "Optimize", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "research", label: "Research", icon: <Search className="h-3.5 w-3.5" /> },
  { id: "explain", label: "Explain", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: "summarize", label: "Summarize", icon: <ListTree className="h-3.5 w-3.5" /> },
  { id: "translate", label: "Translate", icon: <Languages className="h-3.5 w-3.5" /> },
  { id: "continue", label: "Continue", icon: <RefreshCcw className="h-3.5 w-3.5" /> },
  { id: "refactor", label: "Refactor", icon: <Code2 className="h-3.5 w-3.5" /> },
  { id: "analyze", label: "Analyze", icon: <Braces className="h-3.5 w-3.5" /> },
];

const ATTACH_KINDS: { id: HuppAttachmentKind; label: string; icon: React.ReactNode }[] = [
  { id: "image", label: "Image", icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { id: "pdf", label: "PDF", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "word", label: "Word", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "excel", label: "Excel", icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
  { id: "powerpoint", label: "PowerPoint", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "zip", label: "ZIP", icon: <FileArchive className="h-3.5 w-3.5" /> },
  { id: "audio", label: "Audio", icon: <Music className="h-3.5 w-3.5" /> },
  { id: "video", label: "Video", icon: <VideoIcon className="h-3.5 w-3.5" /> },
  { id: "github", label: "GitHub Repo", icon: <Github className="h-3.5 w-3.5" /> },
  { id: "git-url", label: "Git URL", icon: <Link2 className="h-3.5 w-3.5" /> },
  { id: "website-url", label: "Website URL", icon: <Link2 className="h-3.5 w-3.5" /> },
  { id: "folder", label: "Folder", icon: <Folder className="h-3.5 w-3.5" /> },
];

const EXPORT_ITEMS: { intent: HuppActionIntent; label: string }[] = [
  { intent: "export-txt", label: "TXT" },
  { intent: "export-md", label: "Markdown" },
  { intent: "export-pdf", label: "PDF" },
  { intent: "export-docx", label: "DOCX" },
  { intent: "export-html", label: "HTML" },
  { intent: "export-json", label: "JSON" },
  { intent: "export-yaml", label: "YAML" },
  { intent: "export-csv", label: "CSV" },
  { intent: "export-clipboard", label: "Clipboard" },
];

// ────────────────────────────────────────────────────────────────
// Undo/Redo history (in-memory, per instance).
// ────────────────────────────────────────────────────────────────
function useHistory(initial: string) {
  const past = React.useRef<string[]>([]);
  const future = React.useRef<string[]>([]);
  const last = React.useRef<string>(initial);

  const record = React.useCallback((next: string) => {
    if (next === last.current) return;
    past.current.push(last.current);
    if (past.current.length > 200) past.current.shift();
    future.current = [];
    last.current = next;
  }, []);

  const undo = React.useCallback((current: string): string | null => {
    const prev = past.current.pop();
    if (prev === undefined) return null;
    future.current.push(current);
    last.current = prev;
    return prev;
  }, []);

  const redo = React.useCallback((current: string): string | null => {
    const next = future.current.pop();
    if (next === undefined) return null;
    past.current.push(current);
    last.current = next;
    return next;
  }, []);

  return { record, undo, redo };
}

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────
export function HappyUniversalPromptBar(props: HappyUniversalPromptBarProps) {
  const {
    defaultValue = "",
    value: controlledValue,
    onValueChange,
    defaultSurface = "chat",
    surfaces: allowedSurfaces,
    defaultMode = "build",
    defaultModel = "auto",
    defaultVisibility = "workspace",
    placeholder = "Ask HAPPY anything — describe what you want to build, generate, or research…",
    disabled,
    busy,
    draftKey = "hupp:draft",
    onSend,
    onAction,
    onVoiceToggle,
    className,
  } = props;

  const isControlled = controlledValue !== undefined;
  const [inner, setInner] = React.useState<string>(defaultValue);
  const value = isControlled ? controlledValue! : inner;
  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInner(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const [surface, setSurface] = React.useState<HuppSurface>(defaultSurface);
  const [mode, setMode] = React.useState<HuppMode>(defaultMode);
  const [model, setModel] = React.useState<HuppModel>(defaultModel);
  const [visibility, setVisibility] = React.useState<HuppVisibility>(defaultVisibility);
  const [attachments, setAttachments] = React.useState<HuppAttachment[]>([]);
  const [variables, setVariables] = React.useState<Record<string, string>>({});
  const [voiceActive, setVoiceActive] = React.useState(false);
  const [urlDialogKind, setUrlDialogKind] = React.useState<HuppAttachmentKind | null>(null);
  const [urlDraft, setUrlDraft] = React.useState("");
  const [newVarKey, setNewVarKey] = React.useState("");
  const [newVarVal, setNewVarVal] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const history = useHistory(value);

  const shownSurfaces = React.useMemo(
    () => (allowedSurfaces?.length ? SURFACES.filter((s) => allowedSurfaces.includes(s.id)) : SURFACES),
    [allowedSurfaces],
  );

  // Draft load
  React.useEffect(() => {
    if (!draftKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw && !value) {
        setValue(raw);
        history.record(raw);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Draft save (debounced)
  React.useEffect(() => {
    if (!draftKey || typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, value);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [value, draftKey]);

  // Auto-resize textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 480)}px`;
  }, [value]);

  const buildPayload = React.useCallback(
    (): HuppSendPayload => ({
      prompt: value,
      surface,
      mode,
      model,
      visibility,
      attachments,
      variables,
    }),
    [value, surface, mode, model, visibility, attachments, variables],
  );

  const handleSend = React.useCallback(async () => {
    if (!value.trim() || disabled || busy) return;
    try {
      await onSend?.(buildPayload());
    } catch (err) {
      toast.error("Send failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [value, disabled, busy, onSend, buildPayload]);

  const dispatch = React.useCallback(
    async (intent: HuppActionIntent) => {
      const payload = buildPayload();
      try {
        // Built-in copy handling — otherwise delegate.
        if (
          intent === "copy" ||
          intent === "copy-prompt" ||
          intent === "copy-markdown" ||
          intent === "copy-html" ||
          intent === "copy-json" ||
          intent === "copy-yaml" ||
          intent === "export-clipboard"
        ) {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            let text = value;
            if (intent === "copy-json") text = JSON.stringify(payload, null, 2);
            if (intent === "copy-yaml") {
              text = Object.entries(payload)
                .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
                .join("\n");
            }
            if (intent === "copy-html") text = `<pre>${value.replace(/</g, "&lt;")}</pre>`;
            await navigator.clipboard.writeText(text);
            toast.success("Copied");
          }
        }
        await onAction?.(intent, payload);
      } catch (err) {
        toast.error("Action failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [buildPayload, onAction, value],
  );

  // Keyboard shortcuts
  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "Enter") {
        e.preventDefault();
        void handleSend();
        return;
      }
      if (mod && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void dispatch("save-draft");
        toast.success("Draft saved");
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        void dispatch("copy-markdown");
        return;
      }
      if (mod && !e.shiftKey && e.key.toLowerCase() === "c" && !window.getSelection()?.toString()) {
        // Only capture when nothing is selected (allow normal text copy otherwise)
        e.preventDefault();
        void dispatch("copy-prompt");
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        void dispatch("open-history");
        return;
      }
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        const prev = history.undo(value);
        if (prev !== null) setValue(prev);
        return;
      }
      if (mod && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        const next = history.redo(value);
        if (next !== null) setValue(next);
        return;
      }
    },
    [handleSend, dispatch, history, value, setValue],
  );

  // Attachments
  const addFileAttachments = React.useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    const mapped: HuppAttachment[] = list.map((f) => {
      let kind: HuppAttachmentKind = "image";
      const name = f.name.toLowerCase();
      if (name.endsWith(".pdf")) kind = "pdf";
      else if (name.match(/\.(doc|docx)$/)) kind = "word";
      else if (name.match(/\.(xls|xlsx|csv)$/)) kind = "excel";
      else if (name.match(/\.(ppt|pptx)$/)) kind = "powerpoint";
      else if (name.endsWith(".zip")) kind = "zip";
      else if (f.type.startsWith("audio/")) kind = "audio";
      else if (f.type.startsWith("video/")) kind = "video";
      else if (f.type.startsWith("image/")) kind = "image";
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind,
        name: f.name,
        size: f.size,
      };
    });
    setAttachments((prev) => [...prev, ...mapped]);
  }, []);

  const onPaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (e.clipboardData?.files?.length) {
        e.preventDefault();
        addFileAttachments(e.clipboardData.files);
      }
    },
    [addFileAttachments],
  );

  const onDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer?.files?.length) {
        addFileAttachments(e.dataTransfer.files);
      }
    },
    [addFileAttachments],
  );

  const onDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const openUrlAttach = (kind: HuppAttachmentKind) => {
    setUrlDraft("");
    setUrlDialogKind(kind);
  };

  const commitUrlAttach = () => {
    if (!urlDialogKind || !urlDraft.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: urlDialogKind,
        name: urlDraft.trim(),
        url: urlDraft.trim(),
      },
    ]);
    setUrlDialogKind(null);
    setUrlDraft("");
  };

  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  const currentModeMeta = MODES.find((m) => m.id === mode) ?? MODES[0];
  const currentModel = MODELS.find((m) => m.id === model) ?? MODELS[0];
  const currentSurface = SURFACES.find((s) => s.id === surface) ?? SURFACES[0];
  const VisibilityIcon = visibility === "private" ? EyeOff : Eye;

  const canSend = value.trim().length > 0 && !disabled && !busy;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "w-full rounded-2xl border bg-card text-card-foreground shadow-sm",
          "focus-within:ring-2 focus-within:ring-ring/40",
          className,
        )}
        role="group"
        aria-label="HAPPY Universal Prompt Composer"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {/* Surface tabs */}
        <div className="border-b px-2 pt-2">
          <ScrollArea className="w-full">
            <Tabs value={surface} onValueChange={(v) => setSurface(v as HuppSurface)}>
              <TabsList className="h-9 flex flex-wrap gap-1 bg-transparent p-0">
                {shownSurfaces.map((s) => (
                  <TabsTrigger
                    key={s.id}
                    value={s.id}
                    className="h-8 rounded-md px-2.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {s.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </ScrollArea>
        </div>

        {/* Attachments row */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b px-3 py-2">
            {attachments.map((a) => {
              const meta = ATTACH_KINDS.find((k) => k.id === a.kind);
              return (
                <Badge key={a.id} variant="secondary" className="gap-1.5 pr-1">
                  {meta?.icon}
                  <span className="max-w-[180px] truncate text-xs">{a.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="ml-1 rounded p-0.5 hover:bg-muted-foreground/10"
                    aria-label={`Remove ${a.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Prompt textarea */}
        <div className="px-3 pt-3">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              history.record(e.target.value);
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            className="min-h-[88px] resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            aria-label="Prompt input"
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 border-t px-2 py-2">
          {/* Attach */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFileAttachments(e.target.files);
              e.target.value = "";
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                <Paperclip className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Attach</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Attach</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                <FolderOpen className="mr-2 h-4 w-4" /> Files from device
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {ATTACH_KINDS.filter((k) =>
                ["github", "git-url", "website-url", "folder"].includes(k.id),
              ).map((k) => (
                <DropdownMenuItem key={k.id} onSelect={() => openUrlAttach(k.id)}>
                  <span className="mr-2 inline-flex">{k.icon}</span>
                  {k.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Voice */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={voiceActive ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => {
                  const next = !voiceActive;
                  setVoiceActive(next);
                  onVoiceToggle?.(next);
                }}
                aria-pressed={voiceActive}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice input</TooltipContent>
          </Tooltip>

          {/* Mode */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
                {currentModeMeta.icon}
                <span>{currentModeMeta.label}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Mode</DropdownMenuLabel>
              {MODES.map((m) => (
                <DropdownMenuItem key={m.id} onSelect={() => setMode(m.id)}>
                  <span className="mr-2 inline-flex">{m.icon}</span>
                  {m.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Model */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{currentModel.label}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Model</DropdownMenuLabel>
              {MODELS.map((m) => (
                <DropdownMenuItem key={m.id} onSelect={() => setModel(m.id)}>
                  {m.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs capitalize">
                <VisibilityIcon className="h-3.5 w-3.5" />
                <span>{visibility}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Visibility</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setVisibility("private")}>
                <EyeOff className="mr-2 h-4 w-4" /> Private
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setVisibility("workspace")}>
                <Eye className="mr-2 h-4 w-4" /> Workspace
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setVisibility("public")}>
                <Share2 className="mr-2 h-4 w-4" /> Public
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Variables */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
                <Variable className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Vars</span>
                {Object.keys(variables).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {Object.keys(variables).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <div className="text-xs font-medium">Prompt variables</div>
                <div className="text-[11px] text-muted-foreground">
                  Use as <code className="rounded bg-muted px-1">{"{{name}}"}</code> in the prompt.
                </div>
                <div className="space-y-1.5">
                  {Object.entries(variables).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[11px]">{k}</Badge>
                      <span className="flex-1 truncate text-xs">{v}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          setVariables((prev) => {
                            const next = { ...prev };
                            delete next[k];
                            return next;
                          })
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="name"
                    value={newVarKey}
                    onChange={(e) => setNewVarKey(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="value"
                    value={newVarVal}
                    onChange={(e) => setNewVarVal(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      const k = newVarKey.trim();
                      if (!k) return;
                      setVariables((prev) => ({ ...prev, [k]: newVarVal }));
                      setNewVarKey("");
                      setNewVarVal("");
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings / Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => dispatch("copy-prompt")}>
                <Copy className="mr-2 h-4 w-4" /> Copy prompt
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => dispatch("copy-markdown")}>
                <Copy className="mr-2 h-4 w-4" /> Copy markdown
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => dispatch("save-prompt")}>
                <Save className="mr-2 h-4 w-4" /> Save prompt
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => dispatch("save-draft")}>
                <Save className="mr-2 h-4 w-4" /> Save draft
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => dispatch("open-history")}>
                <History className="mr-2 h-4 w-4" /> Prompt history
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => dispatch("open-favorites")}>
                <Star className="mr-2 h-4 w-4" /> Favorites
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => dispatch("open-collections")}>
                <FolderOpen className="mr-2 h-4 w-4" /> Collections
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => dispatch("open-templates")}>
                <FileText className="mr-2 h-4 w-4" /> Templates
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => dispatch("open-pinned")}>
                <Pin className="mr-2 h-4 w-4" /> Pinned
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export</DropdownMenuLabel>
              {EXPORT_ITEMS.map((it) => (
                <DropdownMenuItem key={it.intent} onSelect={() => dispatch(it.intent)}>
                  <Download className="mr-2 h-4 w-4" /> {it.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => dispatch("share")}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => dispatch("duplicate")}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setValue("");
                  setAttachments([]);
                  void dispatch("delete");
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const prev = history.undo(value);
                  if (prev !== null) setValue(prev);
                }}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const next = history.redo(value);
                  if (next !== null) setValue(next);
                }}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[11px] text-muted-foreground md:inline">
              {currentSurface.label} · Ctrl+Enter
            </span>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5"
              disabled={!canSend}
              onClick={() => void handleSend()}
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </Button>
          </div>
        </div>

        {/* URL attach dialog */}
        <Dialog open={urlDialogKind !== null} onOpenChange={(o) => !o && setUrlDialogKind(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Attach {urlDialogKind ? ATTACH_KINDS.find((k) => k.id === urlDialogKind)?.label : ""}
              </DialogTitle>
              <DialogDescription>
                Paste a URL or path. HAPPY will fetch and index it through the canonical Knowledge
                runtime.
              </DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder={
                urlDialogKind === "github"
                  ? "https://github.com/owner/repo"
                  : urlDialogKind === "folder"
                    ? "/path/to/folder"
                    : "https://…"
              }
              onKeyDown={(e) => e.key === "Enter" && commitUrlAttach()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setUrlDialogKind(null)}>
                Cancel
              </Button>
              <Button onClick={commitUrlAttach} disabled={!urlDraft.trim()}>
                Attach
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default HappyUniversalPromptBar;

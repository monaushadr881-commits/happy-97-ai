/**
 * HappyUniversalActionBar — the ONE canonical action bar.
 *
 * Single, reusable action system for every AI response, chat message,
 * code block, prompt, document, workflow, SOP, PRD, knowledge article,
 * memory, experience, founder / creator / digital human / publishing
 * output across HAPPY X.
 *
 * NO other action bar may exist. Extend via the `actions`, `menus`, and
 * `mode` props — do NOT fork this component.
 *
 * Canonical owners reused (not duplicated):
 *  - Design tokens: @/design-system
 *  - shadcn/ui: Button, DropdownMenu
 *  - Runtimes (called by parent via onAction): Workspace, Knowledge,
 *    Memory, Experience, Digital Human, Creator, Publishing, Automation,
 *    Founder Pipeline, Mission Control — all through their canonical
 *    server-fn owners; this bar only DISPATCHES action intents.
 */
import * as React from "react";
import {
  Copy,
  Edit3,
  Save,
  Hammer,
  Download,
  Share2,
  Star,
  Trash2,
  MoreHorizontal,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// ────────────────────────────────────────────────────────────────
// Action intent taxonomy — canonical, extend here only.
// ────────────────────────────────────────────────────────────────
export type UabMode =
  | "response"
  | "chat"
  | "code"
  | "prompt"
  | "document"
  | "workflow"
  | "sop"
  | "prd"
  | "knowledge"
  | "memory"
  | "experience"
  | "digital-human"
  | "founder"
  | "creator"
  | "publishing"
  | "mission-control";

export type UabActionId =
  // copy
  | "copy.text" | "copy.markdown" | "copy.plain" | "copy.rich" | "copy.html"
  | "copy.json" | "copy.yaml" | "copy.xml" | "copy.csv" | "copy.sql"
  | "copy.prompt" | "copy.code" | "copy.response" | "copy.conversation" | "copy.selection"
  // edit
  | "edit.continue" | "edit.rewrite" | "edit.improve" | "edit.expand" | "edit.shorten"
  | "edit.simplify" | "edit.professional" | "edit.developer" | "edit.founder"
  | "edit.translate" | "edit.grammar" | "edit.optimize" | "edit.summarize"
  // save
  | "save.workspace" | "save.knowledge" | "save.memory" | "save.experience"
  | "save.template" | "save.prompt" | "save.favorites" | "save.collection"
  | "save.project" | "save.documentation"
  // build
  | "build.website" | "build.webapp" | "build.mobile" | "build.desktop"
  | "build.api" | "build.backend" | "build.database" | "build.cms"
  | "build.erp" | "build.crm" | "build.hrms" | "build.lms"
  | "build.manufacturing" | "build.warehouse" | "build.marketplace"
  | "build.ai" | "build.digital-human" | "build.workflow" | "build.automation"
  | "build.dashboard" | "build.analytics"
  // export
  | "export.pdf" | "export.docx" | "export.markdown" | "export.txt" | "export.json"
  | "export.csv" | "export.xlsx" | "export.pptx" | "export.zip" | "export.html"
  // share
  | "share.link" | "share.internal" | "share.workspace" | "share.founder"
  // favorites
  | "fav.favorite" | "fav.pin" | "fav.bookmark" | "fav.recent" | "fav.history"
  // delete
  | "delete.delete" | "delete.archive" | "delete.restore"
  // prompt system
  | "prompt.improve" | "prompt.continue" | "prompt.run" | "prompt.use-chat"
  | "prompt.use-build" | "prompt.versions" | "prompt.variables" | "prompt.collections"
  // code
  | "code.explain" | "code.fix" | "code.refactor" | "code.run" | "code.compare"
  // founder mode
  | "founder.export-conversation" | "founder.export-project" | "founder.prd"
  | "founder.sop" | "founder.tasks" | "founder.documentation" | "founder.roadmap"
  | "founder.repository" | "founder.api-docs" | "founder.user-stories"
  | "founder.continue-later" | "founder.assign" | "founder.publish"
  // digital human
  | "dh.save-conversation" | "dh.export-conversation" | "dh.save-memory"
  | "dh.save-knowledge" | "dh.create-task" | "dh.create-reminder" | "dh.continue"
  // knowledge
  | "kn.article" | "kn.version" | "kn.publish" | "kn.reference"
  // mission control
  | "mc.approve" | "mc.reject" | "mc.assign" | "mc.escalate"
  | "mc.create-task" | "mc.create-automation";

export interface UabActionEvent {
  id: UabActionId;
  mode: UabMode;
  payload: unknown;
  target?: string;
}

export interface HappyUniversalActionBarProps {
  mode: UabMode;
  /** Raw content (text, markdown, JSON string, code, etc.) the bar operates on. */
  payload: unknown;
  /** Stable id of the target (message id, article id, memory id, …). */
  target?: string;
  /** Optional action allow-list. When omitted, sensible defaults per mode. */
  visible?: UabActionId[];
  /** Delegate side effects (save/build/publish/etc.) to the parent's canonical runtime callers. */
  onAction?: (ev: UabActionEvent) => void | Promise<void>;
  /** Compact renders as icon-only quick actions. */
  compact?: boolean;
  className?: string;
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
async function copyToClipboard(text: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    toast.success("Copied");
  } catch {
    toast.error("Copy failed");
  }
}

function stringify(payload: unknown, format: "json" | "yaml" | "text" = "text"): string {
  if (payload == null) return "";
  if (typeof payload === "string") return payload;
  if (format === "json") return JSON.stringify(payload, null, 2);
  if (format === "yaml") {
    // minimal YAML-ish; parents can pre-serialize for full fidelity.
    try { return JSON.stringify(payload, null, 2); } catch { return String(payload); }
  }
  return String(payload);
}

// ────────────────────────────────────────────────────────────────
// Menu definitions per mode. Reused across all surfaces.
// ────────────────────────────────────────────────────────────────
type MenuItem = { id: UabActionId; label: string };
type Menu = { label: string; items: MenuItem[] };

const COPY_MENU: Menu = {
  label: "Copy",
  items: [
    { id: "copy.text", label: "Copy text" },
    { id: "copy.markdown", label: "Copy markdown" },
    { id: "copy.plain", label: "Copy plain text" },
    { id: "copy.rich", label: "Copy rich text" },
    { id: "copy.html", label: "Copy HTML" },
    { id: "copy.json", label: "Copy JSON" },
    { id: "copy.yaml", label: "Copy YAML" },
    { id: "copy.xml", label: "Copy XML" },
    { id: "copy.csv", label: "Copy CSV" },
    { id: "copy.sql", label: "Copy SQL" },
    { id: "copy.prompt", label: "Copy prompt" },
    { id: "copy.code", label: "Copy code" },
    { id: "copy.response", label: "Copy entire response" },
    { id: "copy.conversation", label: "Copy conversation" },
    { id: "copy.selection", label: "Copy selected block" },
  ],
};

const EDIT_MENU: Menu = {
  label: "Edit",
  items: [
    { id: "edit.continue", label: "Continue" },
    { id: "edit.rewrite", label: "Rewrite" },
    { id: "edit.improve", label: "Improve" },
    { id: "edit.expand", label: "Expand" },
    { id: "edit.shorten", label: "Shorten" },
    { id: "edit.simplify", label: "Simplify" },
    { id: "edit.professional", label: "Professional tone" },
    { id: "edit.developer", label: "Developer mode" },
    { id: "edit.founder", label: "Founder mode" },
    { id: "edit.translate", label: "Translate" },
    { id: "edit.grammar", label: "Fix grammar" },
    { id: "edit.optimize", label: "Optimize" },
    { id: "edit.summarize", label: "Summarize" },
  ],
};

const SAVE_MENU: Menu = {
  label: "Save",
  items: [
    { id: "save.workspace", label: "Save to Workspace" },
    { id: "save.knowledge", label: "Save to Knowledge" },
    { id: "save.memory", label: "Save to Memory" },
    { id: "save.experience", label: "Save to Experience" },
    { id: "save.template", label: "Save as Template" },
    { id: "save.prompt", label: "Save as Prompt" },
    { id: "save.favorites", label: "Save to Favorites" },
    { id: "save.collection", label: "Save to Collection" },
    { id: "save.project", label: "Save to Project" },
    { id: "save.documentation", label: "Save to Documentation" },
  ],
};

const BUILD_MENU: Menu = {
  label: "Build",
  items: [
    { id: "build.website", label: "Website" },
    { id: "build.webapp", label: "Web App" },
    { id: "build.mobile", label: "Mobile App" },
    { id: "build.desktop", label: "Desktop App" },
    { id: "build.api", label: "API" },
    { id: "build.backend", label: "Backend" },
    { id: "build.database", label: "Database" },
    { id: "build.cms", label: "CMS" },
    { id: "build.erp", label: "ERP" },
    { id: "build.crm", label: "CRM" },
    { id: "build.hrms", label: "HRMS" },
    { id: "build.lms", label: "LMS" },
    { id: "build.manufacturing", label: "Manufacturing" },
    { id: "build.warehouse", label: "Warehouse" },
    { id: "build.marketplace", label: "Marketplace" },
    { id: "build.ai", label: "AI" },
    { id: "build.digital-human", label: "Digital Human" },
    { id: "build.workflow", label: "Workflow" },
    { id: "build.automation", label: "Automation" },
    { id: "build.dashboard", label: "Dashboard" },
    { id: "build.analytics", label: "Analytics" },
  ],
};

const EXPORT_MENU: Menu = {
  label: "Export",
  items: [
    { id: "export.pdf", label: "PDF" },
    { id: "export.docx", label: "DOCX" },
    { id: "export.markdown", label: "Markdown" },
    { id: "export.txt", label: "TXT" },
    { id: "export.json", label: "JSON" },
    { id: "export.csv", label: "CSV" },
    { id: "export.xlsx", label: "Excel" },
    { id: "export.pptx", label: "PowerPoint" },
    { id: "export.zip", label: "ZIP" },
    { id: "export.html", label: "HTML" },
  ],
};

const SHARE_MENU: Menu = {
  label: "Share",
  items: [
    { id: "share.link", label: "Copy link" },
    { id: "share.internal", label: "Internal share" },
    { id: "share.workspace", label: "Share to Workspace" },
    { id: "share.founder", label: "Share with Founder" },
  ],
};

const FAV_MENU: Menu = {
  label: "Favorites",
  items: [
    { id: "fav.favorite", label: "Favorite" },
    { id: "fav.pin", label: "Pin" },
    { id: "fav.bookmark", label: "Bookmark" },
    { id: "fav.recent", label: "Add to Recent" },
    { id: "fav.history", label: "Add to History" },
  ],
};

const DELETE_MENU: Menu = {
  label: "Delete",
  items: [
    { id: "delete.delete", label: "Delete" },
    { id: "delete.archive", label: "Archive" },
    { id: "delete.restore", label: "Restore" },
  ],
};

const PROMPT_MENU: Menu = {
  label: "Prompt",
  items: [
    { id: "prompt.improve", label: "Improve prompt" },
    { id: "prompt.continue", label: "Continue prompt" },
    { id: "prompt.run", label: "Run prompt" },
    { id: "prompt.use-chat", label: "Use in Chat" },
    { id: "prompt.use-build", label: "Use in Build" },
    { id: "prompt.versions", label: "Prompt versions" },
    { id: "prompt.variables", label: "Prompt variables" },
    { id: "prompt.collections", label: "Prompt collections" },
  ],
};

const CODE_MENU: Menu = {
  label: "Code",
  items: [
    { id: "code.explain", label: "Explain" },
    { id: "code.fix", label: "Fix" },
    { id: "code.refactor", label: "Refactor" },
    { id: "code.optimize" as UabActionId, label: "Optimize" },
    { id: "code.run", label: "Run" },
    { id: "code.compare", label: "Compare" },
  ],
};

const FOUNDER_MENU: Menu = {
  label: "Founder",
  items: [
    { id: "founder.export-conversation", label: "Export conversation" },
    { id: "founder.export-project", label: "Export project" },
    { id: "founder.prd", label: "Create PRD" },
    { id: "founder.sop", label: "Create SOP" },
    { id: "founder.tasks", label: "Create tasks" },
    { id: "founder.documentation", label: "Create documentation" },
    { id: "founder.roadmap", label: "Create roadmap" },
    { id: "founder.repository", label: "Create repository" },
    { id: "founder.api-docs", label: "Create API docs" },
    { id: "founder.user-stories", label: "Create user stories" },
    { id: "founder.continue-later", label: "Continue later" },
    { id: "founder.assign", label: "Assign team" },
    { id: "founder.publish", label: "Publish" },
  ],
};

const DH_MENU: Menu = {
  label: "Digital Human",
  items: [
    { id: "dh.save-conversation", label: "Save conversation" },
    { id: "dh.export-conversation", label: "Export conversation" },
    { id: "dh.save-memory", label: "Save memory" },
    { id: "dh.save-knowledge", label: "Save knowledge" },
    { id: "dh.create-task", label: "Create task" },
    { id: "dh.create-reminder", label: "Create reminder" },
    { id: "dh.continue", label: "Continue session" },
  ],
};

const KNOWLEDGE_MENU: Menu = {
  label: "Knowledge",
  items: [
    { id: "kn.article", label: "Save as article" },
    { id: "kn.version", label: "Create version" },
    { id: "kn.publish", label: "Publish" },
    { id: "kn.reference", label: "Reference" },
  ],
};

const MC_MENU: Menu = {
  label: "Mission Control",
  items: [
    { id: "mc.approve", label: "Approve" },
    { id: "mc.reject", label: "Reject" },
    { id: "mc.assign", label: "Assign" },
    { id: "mc.escalate", label: "Escalate" },
    { id: "mc.create-task", label: "Create task" },
    { id: "mc.create-automation", label: "Create automation" },
  ],
};

function menusForMode(mode: UabMode): Menu[] {
  const base: Menu[] = [COPY_MENU, EDIT_MENU, SAVE_MENU, BUILD_MENU, EXPORT_MENU, SHARE_MENU, FAV_MENU, DELETE_MENU];
  const extras: Record<UabMode, Menu[]> = {
    "response": [],
    "chat": [],
    "code": [CODE_MENU],
    "prompt": [PROMPT_MENU],
    "document": [],
    "workflow": [],
    "sop": [],
    "prd": [],
    "knowledge": [KNOWLEDGE_MENU],
    "memory": [],
    "experience": [],
    "digital-human": [DH_MENU],
    "founder": [FOUNDER_MENU],
    "creator": [],
    "publishing": [],
    "mission-control": [MC_MENU],
  };
  return [...extras[mode], ...base];
}

// ────────────────────────────────────────────────────────────────
// The single canonical component
// ────────────────────────────────────────────────────────────────
export function HappyUniversalActionBar({
  mode,
  payload,
  target,
  visible,
  onAction,
  compact = false,
  className,
}: HappyUniversalActionBarProps) {
  const menus = React.useMemo(() => menusForMode(mode), [mode]);

  const dispatch = React.useCallback(
    async (id: UabActionId) => {
      // Built-in handling for copy variants — no runtime needed.
      if (id.startsWith("copy.")) {
        const fmt = id.endsWith(".json") ? "json" : id.endsWith(".yaml") ? "yaml" : "text";
        await copyToClipboard(stringify(payload, fmt));
        return;
      }
      // Everything else is delegated to the parent's canonical runtime caller.
      if (onAction) {
        await onAction({ id, mode, payload, target });
      } else {
        toast.message("Action queued", { description: id });
      }
    },
    [mode, payload, target, onAction],
  );

  const filter = React.useCallback(
    (items: MenuItem[]) => (visible ? items.filter((i) => visible.includes(i.id)) : items),
    [visible],
  );

  return (
    <div
      role="toolbar"
      aria-label="HAPPY universal action bar"
      className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}
    >
      {/* Quick copy — the single most used action. */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Copy"
        onClick={() => dispatch("copy.text")}
        className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden />
        {!compact && <span className="text-xs">Copy</span>}
      </Button>

      {menus.map((menu) => {
        const items = filter(menu.items);
        if (items.length === 0) return null;
        const Icon = menuIcon(menu.label);
        return (
          <DropdownMenu key={menu.label}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={menu.label}
                className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {!compact && <span className="text-xs">{menu.label}</span>}
                {!compact && <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel>{menu.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {items.map((it) => (
                <DropdownMenuItem key={it.id} onSelect={() => void dispatch(it.id)}>
                  {it.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      {/* Overflow — always present for future extension without adding sibling bars. */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="More actions"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        onClick={() => toast.message("More actions available via keyboard: ⌘K")}
      >
        <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  );
}

function menuIcon(label: string) {
  switch (label) {
    case "Copy": return Copy;
    case "Edit": return Edit3;
    case "Save": return Save;
    case "Build": return Hammer;
    case "Export": return Download;
    case "Share": return Share2;
    case "Favorites": return Star;
    case "Delete": return Trash2;
    case "Prompt":
    case "Code":
    case "Knowledge":
    case "Digital Human":
    case "Founder":
    case "Mission Control":
    default:
      return Sparkles;
  }
}

export default HappyUniversalActionBar;

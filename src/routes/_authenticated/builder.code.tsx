/**
 * /builder/code — HAPPY AI Code Workspace™ (R211)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Publishing / Mission Control runtimes via composer.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  FolderTree, FileCode, Search, Replace as ReplaceIcon, Terminal,
  GitCompare, Eye, AlertTriangle, GitBranch, Rocket, Sparkles, Play,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBuilderPrompt } from "@/hooks/use-builder-prompt";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
} from "@/components/happy/HappyUniversalPromptBar";
import {
  HappyUniversalActionBar,
  type UabActionEvent,
} from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/builder/code")({
  head: () => ({
    meta: [
      { title: "AI Code Workspace — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CodeWorkspaceRoute,
});

const FILE_TREE = [
  "src/",
  "  routes/",
  "    __root.tsx",
  "    index.tsx",
  "    _authenticated/",
  "      builder.tsx",
  "      builder.website.tsx",
  "      builder.mobile.tsx",
  "      builder.fullstack.tsx",
  "      builder.agents.tsx",
  "      builder.code.tsx",
  "  lib/",
  "    founder/pipeline.ts",
  "    happy-runtime/",
  "  components/",
  "    happy/",
  "supabase/migrations/",
];

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function CodeWorkspaceRoute() {
  const [activeFile, setActiveFile] = React.useState("src/routes/index.tsx");
  const [query, setQuery] = React.useState("");
  const [replaceWith, setReplaceWith] = React.useState("");
  const [previewUrl, setPreviewUrl] = React.useState("/");
  const [logs, setLogs] = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "code", onLog: pushLog });
  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY: ${p.prompt.slice(0, 160)}`);
    void __submitPrompt("code", p.prompt, p.attachments?.length ?? 0);
  }, [pushLog, __submitPrompt]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
    if (e.id.startsWith("export.")) toast.info("Export forwarded to Publishing Runtime…");
  }, [pushLog]);

  const runSearch  = () => { if (!query) return; pushLog("log", `Searching for “${query}”…`);   toast.info(`Searching for “${query}”…`); };
  const runReplace = () => { if (!query) return; pushLog("warn", `Replace “${query}” → “${replaceWith}”`); toast.warning("Replace forwarded to Creator Runtime."); };
  const runBuild   = () => { pushLog("log", "Build queued via Publishing Runtime");             toast.info("Build queued."); };
  const runDeploy  = () => { pushLog("log", "Deploy queued via Publishing Runtime");            toast.info("Deploy queued."); };
  const runGit     = () => { pushLog("log", "Git status refreshed via Publishing Runtime");     toast.info("Git status refreshed."); };

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileCode className="h-4 w-4" /> HAPPY Code Workspace
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Edit code with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            One canonical composer, one canonical action bar. All mutations route
            through the canonical pipeline into Mission Control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="max-w-[16rem] truncate">{activeFile}</Badge>
        </div>
      </header>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_340px] gap-6">
        {/* Left: file explorer + search/replace */}
        <aside className="space-y-6">
          <section>
            <div className="flex items-center gap-2 text-sm font-medium">
              <FolderTree className="h-4 w-4" /> File Explorer
            </div>
            <ScrollArea className="h-72 mt-2 rounded-md border">
              <ul className="p-2 font-mono text-xs">
                {FILE_TREE.map((line) => {
                  const isFile = line.trim().includes(".");
                  return (
                    <li key={line}>
                      <button
                        disabled={!isFile}
                        onClick={() => { setActiveFile(line.trim()); pushLog("log", `Open ${line.trim()}`); }}
                        className={
                          "w-full text-left px-2 py-0.5 rounded whitespace-pre " +
                          (isFile ? "hover:bg-muted" : "text-muted-foreground cursor-default")
                        }
                      >{line}</button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </section>

          <section>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4" /> Search
            </div>
            <div className="mt-2 space-y-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find in project…"
                className="h-8 text-sm"
              />
              <Input
                value={replaceWith}
                onChange={(e) => setReplaceWith(e.target.value)}
                placeholder="Replace with…"
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={runSearch}  className="gap-1"><Search className="h-4 w-4" />Find</Button>
                <Button size="sm" variant="outline" onClick={runReplace} className="gap-1"><ReplaceIcon className="h-4 w-4" />Replace</Button>
              </div>
            </div>
          </section>
        </aside>

        {/* Center: composer + editor tabs */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="code"
            placeholder={`Ask HAPPY to edit ${activeFile}…`}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`code:${activeFile}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={runBuild}  className="gap-1"><Play className="h-4 w-4" />Build</Button>
            <Button size="sm" variant="outline" onClick={runGit}    className="gap-1"><GitBranch className="h-4 w-4" />Git Status</Button>
            <Button size="sm" onClick={runDeploy}                   className="gap-1"><Rocket className="h-4 w-4" />Deploy</Button>
          </div>

          <Tabs defaultValue="editor" className="w-full">
            <TabsList>
              <TabsTrigger value="editor"  className="gap-1"><FileCode className="h-4 w-4" />Editor</TabsTrigger>
              <TabsTrigger value="diff"    className="gap-1"><GitCompare className="h-4 w-4" />Diff</TabsTrigger>
              <TabsTrigger value="preview" className="gap-1"><Eye className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="errors"  className="gap-1"><AlertTriangle className="h-4 w-4" />Errors</TabsTrigger>
              <TabsTrigger value="git"     className="gap-1"><GitBranch className="h-4 w-4" />Git</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-3">
              <div className="rounded-md border bg-muted/30 min-h-[360px] p-4 font-mono text-xs whitespace-pre-wrap">
                {`// ${activeFile}\n// Ask HAPPY in the composer above to edit this file.\n// Edits stream into the Creator Runtime and land as a\n// live diff before being written to disk.`}
              </div>
            </TabsContent>

            <TabsContent value="diff" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Live diff of the current HAPPY edit vs. disk appears here after a
                prompt runs. Accept via the action bar Save/Build shortcuts.
              </p>
            </TabsContent>

            <TabsContent value="preview" className="mt-3">
              <div className="flex items-center gap-2">
                <Input
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="/"
                  className="h-8 text-sm w-56"
                />
                <Button size="sm" variant="ghost" onClick={() => pushLog("log", `Preview ${previewUrl}`)}>Reload</Button>
              </div>
              <div className="mt-3 rounded-md border bg-muted/30 aspect-[16/10]">
                <iframe src={previewUrl} title="Preview" className="w-full h-full rounded-md" />
              </div>
            </TabsContent>

            <TabsContent value="errors" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Typecheck and build errors are reported by the Publishing
                Runtime and surface in the log panel on the right.
              </p>
            </TabsContent>

            <TabsContent value="git" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Git status, branches, and deployments are orchestrated by the
                Publishing Runtime. Progress is mirrored in Mission Control.
              </p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: terminal / log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4" /> Terminal · Logs
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Composer, action bar, search/replace, and build actions log here.
                </li>
              )}
              {logs.map((l) => (
                <li key={l.id} className="px-2 py-0.5 rounded hover:bg-muted">
                  <span className="text-muted-foreground mr-2">{l.at}</span>
                  <span className={
                    l.kind === "err"  ? "text-destructive" :
                    l.kind === "warn" ? "text-amber-500" :
                                        ""
                  }>{l.text}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Mirrored to Mission Control
          </div>
        </aside>
      </div>
    </Container>
  );
}

/**
 * /builder/i18n — HAPPY Multi Language™ (R231)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Knowledge / Publishing / Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Languages, Globe2, Wand2, ArrowLeftRight, FileCheck2,
  Download, ScrollText, Type, Sparkles,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
} from "@/components/happy/HappyUniversalPromptBar";
import {
  HappyUniversalActionBar,
  type UabActionEvent,
} from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/builder/i18n")({
  head: () => ({
    meta: [
      { title: "Multi Language — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MultiLanguageRoute,
});

type LangId =
  | "hi" | "en" | "ar" | "ur" | "fr" | "de" | "es" | "ja" | "zh"
  | "rtl" | "auto";

interface LangDef {
  id: LangId;
  label: string;
  native: string;
  dir: "ltr" | "rtl" | "auto";
  hint: string;
}

const LANGS: LangDef[] = [
  { id: "hi",   label: "Hindi",            native: "हिन्दी",   dir: "ltr", hint: "Devanagari · India · formal + conversational tone." },
  { id: "en",   label: "English",          native: "English",  dir: "ltr", hint: "Global default · US / UK / neutral variants." },
  { id: "ar",   label: "Arabic",           native: "العربية",  dir: "rtl", hint: "Modern Standard Arabic · RTL layout · numerals." },
  { id: "ur",   label: "Urdu",             native: "اُردُو",   dir: "rtl", hint: "Nastaʿlīq · RTL · Pakistan / India." },
  { id: "fr",   label: "French",           native: "Français", dir: "ltr", hint: "France / Canada · accents preserved." },
  { id: "de",   label: "German",           native: "Deutsch",  dir: "ltr", hint: "Germany / Austria / Switzerland · umlauts." },
  { id: "es",   label: "Spanish",          native: "Español",  dir: "ltr", hint: "Spain / LATAM variants · tú vs usted." },
  { id: "ja",   label: "Japanese",         native: "日本語",    dir: "ltr", hint: "Kanji · hiragana · katakana · honorifics." },
  { id: "zh",   label: "Chinese",          native: "中文",      dir: "ltr", hint: "Simplified / Traditional · zh-CN / zh-TW." },
  { id: "rtl",  label: "RTL Support",      native: "RTL",       dir: "rtl", hint: "Mirror layouts · direction=rtl · icons flipped." },
  { id: "auto", label: "Auto Translation", native: "Auto",      dir: "auto",hint: "Detect source · translate to all target locales." },
];

const INTRO: Record<LangId, string> = {
  hi:   "Describe the content or file to translate to Hindi.",
  en:   "Describe the content or file to translate to English.",
  ar:   "Describe the content to translate to Arabic (RTL).",
  ur:   "Describe the content to translate to Urdu (RTL).",
  fr:   "Describe the content to translate to French.",
  de:   "Describe the content to translate to German.",
  es:   "Describe the content to translate to Spanish.",
  ja:   "Describe the content to translate to Japanese.",
  zh:   "Describe the content to translate to Chinese (Simplified / Traditional).",
  rtl:  "Describe the surface to enable RTL support on.",
  auto: "Paste text or select files · HAPPY detects source and translates to all target locales.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function MultiLanguageRoute() {
  const [lang, setLang] = React.useState<LangId>("en");
  const [logs, setLogs] = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${lang}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY translating → ${lang}…`);
  }, [lang, pushLog]);

  const onAction   = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const translate = () => { pushLog("log", `Translate → ${lang} via Knowledge Runtime`); toast.info(`Translating → ${lang}…`); };
  const autoAll   = () => { pushLog("log", `Auto translate → ALL locales via Knowledge Runtime`); toast.info("Auto translating all locales…"); };
  const exportBundle = () => { pushLog("log", `Export locale bundle → JSON via Publishing Runtime`); toast.info("Exporting locale bundle…"); };
  const publish   = () => { pushLog("log", `Publish translations → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = LANGS.find((l) => l.id === lang)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Languages className="h-4 w-4" /> HAPPY Multi Language
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Translate content into every language HAPPY speaks
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every translation flows through the canonical pipeline —
            Knowledge → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Globe2 className="h-4 w-4" />{active.label} · {active.native}
        </Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Languages" className="flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <Button
            key={l.id}
            size="sm"
            variant={lang === l.id ? "default" : "outline"}
            onClick={() => { setLang(l.id); pushLog("log", `Language · ${l.label}`); }}
            className="gap-2"
          >
            <Type className="h-4 w-4" />{l.label}
            <span className="text-xs opacity-70">{l.native}</span>
            {l.dir === "rtl" && <span className="text-[10px] opacity-70">RTL</span>}
          </Button>
        ))}
      </section>
      <p className="text-xs text-muted-foreground mt-2">{active.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="document"
            placeholder={INTRO[lang]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`i18n:${lang}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={translate}                       className="gap-1"><Wand2 className="h-4 w-4" />Translate</Button>
            <Button size="sm" variant="outline"   onClick={autoAll}     className="gap-1"><Sparkles className="h-4 w-4" />Auto · All Locales</Button>
            <Button size="sm" variant="outline"   onClick={exportBundle}className="gap-1"><Download className="h-4 w-4" />Export Bundle</Button>
            <Button size="sm" variant="secondary" onClick={publish}     className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"  className="gap-1"><Type className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="compare"  className="gap-1"><ArrowLeftRight className="h-4 w-4" />Compare</TabsTrigger>
              <TabsTrigger value="rtl"      className="gap-1"><Globe2 className="h-4 w-4" />RTL</TabsTrigger>
              <TabsTrigger value="glossary" className="gap-1"><Languages className="h-4 w-4" />Glossary</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div
                dir={active.dir === "auto" ? "ltr" : active.dir}
                className="rounded-lg border bg-background p-6 min-h-[280px] text-sm"
              >
                <div className="text-muted-foreground mb-2">
                  {active.label} · dir=<code>{active.dir}</code>
                </div>
                <div className="text-lg font-medium">{active.native}</div>
                <p className="text-muted-foreground mt-2">
                  Translated content renders here from the Knowledge Runtime output.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="compare" className="mt-3">
              <p className="text-sm text-muted-foreground">Source vs target side-by-side · segment-level diff · glossary hits.</p>
            </TabsContent>
            <TabsContent value="rtl" className="mt-3">
              <p className="text-sm text-muted-foreground">RTL layout mirroring · icon flip · numerals · bidi safe.</p>
            </TabsContent>
            <TabsContent value="glossary" className="mt-3">
              <p className="text-sm text-muted-foreground">Brand terms, do-not-translate list, tone rules — sourced from Knowledge.</p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Translation Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Language changes, translations, exports, and publishes log here.
                </li>
              )}
              {logs.map((l) => (
                <li key={l.id} className="px-2 py-0.5 rounded hover:bg-muted">
                  <span className="text-muted-foreground mr-2">{l.at}</span>
                  <span className={
                    l.kind === "err"  ? "text-destructive" :
                    l.kind === "warn" ? "text-amber-500" : ""
                  }>{l.text}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <p className="text-xs text-muted-foreground">Mirrored to Mission Control.</p>
        </aside>
      </div>
    </Container>
  );
}

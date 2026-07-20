/**
 * /marketplace — HAPPY Marketplace Builder™ (R236)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Publishing / Payments / Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Store, User, ShoppingBag, Building2, Package, Receipt,
  CreditCard, Star, Ticket, Repeat,
  Play, Sparkles, Download, FileCheck2, ScrollText, LayoutGrid,
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

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketplaceRoute,
});

type PresetId =
  | "seller" | "buyer" | "vendor" | "products" | "orders"
  | "payments" | "reviews" | "coupons" | "subscriptions";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "seller",        label: "Seller Portal",  icon: <Store className="h-4 w-4" />,        hint: "Seller dashboard · listings · payouts · analytics." },
  { id: "buyer",         label: "Buyer Portal",   icon: <User className="h-4 w-4" />,         hint: "Buyer account · orders · wishlist · addresses." },
  { id: "vendor",        label: "Vendor Portal",  icon: <Building2 className="h-4 w-4" />,    hint: "Vendor onboarding · KYC · catalog · settlements." },
  { id: "products",      label: "Products",       icon: <Package className="h-4 w-4" />,      hint: "Catalog · SKUs · variants · pricing · inventory." },
  { id: "orders",        label: "Orders",         icon: <ShoppingBag className="h-4 w-4" />,  hint: "Cart · checkout · fulfilment · returns." },
  { id: "payments",      label: "Payments",       icon: <CreditCard className="h-4 w-4" />,   hint: "Gateways · payouts · refunds · reconciliation." },
  { id: "reviews",       label: "Reviews",        icon: <Star className="h-4 w-4" />,         hint: "Ratings · moderation · replies · trust score." },
  { id: "coupons",       label: "Coupons",        icon: <Ticket className="h-4 w-4" />,       hint: "Codes · discounts · rules · campaigns." },
  { id: "subscriptions", label: "Subscriptions",  icon: <Repeat className="h-4 w-4" />,       hint: "Plans · billing cycles · renewals · dunning." },
];

const INTRO: Record<PresetId, string> = {
  seller:        "Describe the seller portal · features · payouts.",
  buyer:         "Describe the buyer portal · account · orders.",
  vendor:        "Describe the vendor portal · KYC · settlements.",
  products:      "Describe the product · variants · pricing.",
  orders:        "Describe the order flow · checkout · fulfilment.",
  payments:      "Describe the payment gateway · payouts · refunds.",
  reviews:       "Describe the reviews surface · moderation rules.",
  coupons:       "Describe the coupon · discount · eligibility.",
  subscriptions: "Describe the subscription plan · cycle · pricing.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function MarketplaceRoute() {
  const [preset, setPreset] = React.useState<PresetId>("seller");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY building ${preset}…`);
  }, [preset, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const generate = () => { pushLog("log", `Generate ${preset} via Creator Runtime`);              toast.info(`Generating ${preset}…`); };
  const optimize = () => { pushLog("log", `AI optimize ${preset} via Knowledge Runtime`);         toast.info("HAPPY optimizing…"); };
  const exportRpt= () => { pushLog("log", `Export ${preset} via Publishing Runtime`);             toast.info("Exporting…"); };
  const publish  = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" /> HAPPY Marketplace Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Ship seller, buyer & vendor experiences end-to-end
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every action flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Marketplace presets" className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={preset === p.id ? "default" : "outline"}
            onClick={() => { setPreset(p.id); pushLog("log", `Preset · ${p.label}`); }}
            className="gap-2"
          >
            {p.icon}{p.label}
          </Button>
        ))}
      </section>
      <p className="text-xs text-muted-foreground mt-2">{active.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="fullstack-app"
            placeholder={INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`marketplace:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                       className="gap-1"><Play className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline"   onClick={optimize}   className="gap-1"><Sparkles className="h-4 w-4" />AI Optimize</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt}  className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}    className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"  className="gap-1"><LayoutGrid className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="catalog"  className="gap-1"><Package className="h-4 w-4" />Catalog</TabsTrigger>
              <TabsTrigger value="orders"   className="gap-1"><Receipt className="h-4 w-4" />Orders</TabsTrigger>
              <TabsTrigger value="payments" className="gap-1"><CreditCard className="h-4 w-4" />Payments</TabsTrigger>
              <TabsTrigger value="publish"  className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[280px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · surface renders here from Creator Runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="catalog"  className="mt-3"><p className="text-sm text-muted-foreground">Products · SKUs · variants · inventory · bulk actions.</p></TabsContent>
            <TabsContent value="orders"   className="mt-3"><p className="text-sm text-muted-foreground">Cart · checkout · fulfilment · returns · disputes.</p></TabsContent>
            <TabsContent value="payments" className="mt-3"><p className="text-sm text-muted-foreground">Gateways · payouts · refunds · reconciliation · ledgers.</p></TabsContent>
            <TabsContent value="publish"  className="mt-3"><p className="text-sm text-muted-foreground">Approval · schedule · rollout · rollback · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Marketplace Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, generations, optimizations, exports, and publishes log here.
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

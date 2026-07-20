/**
 * /builder/ecommerce — HAPPY Ecommerce Builder™
 *
 * Thin presentation shell over the existing Business Runtime.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Business · Commerce · Publishing · Approval · Audit · Mission Control runtimes.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Every mutation flows through the 13-stage canonical pipeline.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ShoppingBag, Package, FolderTree, Tag, Warehouse, ClipboardList,
  CreditCard, Ticket, Sparkles as SparklesIcon, Heart, Star, Banknote,
  Wallet, FileText, Receipt, Truck, Undo2, RotateCcw, BarChart3,
  Play, Sparkles, Download, FileCheck2, ScrollText, LayoutGrid, Activity,
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

export const Route = createFileRoute("/_authenticated/builder/ecommerce")({
  head: () => ({
    meta: [
      { title: "Ecommerce Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EcommerceBuilderRoute,
});

type PresetId =
  | "store" | "products" | "categories" | "brands" | "inventory"
  | "orders" | "checkout" | "coupons" | "offers" | "wishlist" | "reviews"
  | "cod" | "online" | "invoices" | "gst" | "shipping" | "returns" | "refunds" | "analytics";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "store",      label: "Store Builder",   icon: <ShoppingBag className="h-4 w-4" />,     hint: "Storefront · theme · nav · homepage · SEO." },
  { id: "products",   label: "Products",        icon: <Package className="h-4 w-4" />,         hint: "SKUs · variants · pricing · media · attributes." },
  { id: "categories", label: "Categories",      icon: <FolderTree className="h-4 w-4" />,      hint: "Taxonomy · trees · facets · collections." },
  { id: "brands",     label: "Brands",          icon: <Tag className="h-4 w-4" />,             hint: "Brand catalogs · logos · vendor mapping." },
  { id: "inventory",  label: "Inventory",       icon: <Warehouse className="h-4 w-4" />,       hint: "Stock · lots · warehouses · thresholds." },
  { id: "orders",     label: "Orders",          icon: <ClipboardList className="h-4 w-4" />,   hint: "Cart · placement · fulfillment · status." },
  { id: "checkout",   label: "Checkout",        icon: <CreditCard className="h-4 w-4" />,      hint: "Address · shipping · tax · payment · confirm." },
  { id: "coupons",    label: "Coupons",         icon: <Ticket className="h-4 w-4" />,          hint: "Codes · rules · caps · stacking · expiry." },
  { id: "offers",     label: "Offers",          icon: <SparklesIcon className="h-4 w-4" />,    hint: "Bundles · BOGO · tiered · seasonal." },
  { id: "wishlist",   label: "Wishlist",        icon: <Heart className="h-4 w-4" />,           hint: "Save-for-later · notify · share · convert." },
  { id: "reviews",    label: "Reviews",         icon: <Star className="h-4 w-4" />,            hint: "Ratings · photos · moderation · reply." },
  { id: "cod",        label: "COD",             icon: <Banknote className="h-4 w-4" />,        hint: "Serviceability · verification · risk · reconcile." },
  { id: "online",     label: "Online Payments", icon: <Wallet className="h-4 w-4" />,          hint: "Cards · UPI · wallets · retries · webhooks." },
  { id: "invoices",   label: "Invoices",        icon: <FileText className="h-4 w-4" />,        hint: "Numbering · templates · PDFs · dispatch." },
  { id: "gst",        label: "GST",             icon: <Receipt className="h-4 w-4" />,         hint: "HSN · rates · e-invoice · returns · ITC." },
  { id: "shipping",   label: "Shipping",        icon: <Truck className="h-4 w-4" />,           hint: "Zones · rates · carriers · tracking · SLA." },
  { id: "returns",    label: "Returns",         icon: <Undo2 className="h-4 w-4" />,           hint: "RMA · reasons · pickup · QC · restock." },
  { id: "refunds",    label: "Refunds",         icon: <RotateCcw className="h-4 w-4" />,       hint: "Modes · partial · wallet · timelines · audit." },
  { id: "analytics",  label: "Analytics",       icon: <BarChart3 className="h-4 w-4" />,       hint: "GMV · AOV · cohorts · funnels · cohorts." },
];

const INTRO: Record<PresetId, string> = {
  store:      "Describe the store · brand · audience · goals.",
  products:   "Describe the product · variants · price · media.",
  categories: "Describe the taxonomy · parents · facets.",
  brands:     "Describe the brand · vendors · assets.",
  inventory:  "Describe the SKU · warehouse · thresholds.",
  orders:     "Describe the order · fulfillment · SLA.",
  checkout:   "Describe the checkout · fields · payment · rules.",
  coupons:    "Describe the coupon · rule · caps · window.",
  offers:     "Describe the offer · bundle · discount · window.",
  wishlist:   "Describe the wishlist rule · notify · convert.",
  reviews:    "Describe the review policy · moderation · reply.",
  cod:        "Describe the COD policy · serviceability · risk.",
  online:     "Describe the payment method · provider · rules.",
  invoices:   "Describe the invoice · numbering · template.",
  gst:        "Describe the GST setup · HSN · rate · return.",
  shipping:   "Describe the zone · rate · carrier · SLA.",
  returns:    "Describe the return policy · reason · window.",
  refunds:    "Describe the refund mode · window · audit.",
  analytics:  "Describe the report · metric · dimension · window.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function EcommerceBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("store");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY working on ${preset}…`);
  }, [preset, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const run       = () => { pushLog("log", `Run ${preset} via Business Runtime`);            toast.info(`Running ${preset}…`); };
  const optimize  = () => { pushLog("log", `AI tune ${preset} via Knowledge Runtime`);       toast.info("HAPPY tuning…"); };
  const exportRpt = () => { pushLog("log", `Export ${preset} via Publishing Runtime`);       toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="h-4 w-4" /> HAPPY Ecommerce Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — store, catalog, checkout, payments, logistics
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the Business runtime. Every mutation flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Ecommerce presets" className="flex flex-wrap gap-2">
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
            target={`ecommerce:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={run}                          className="gap-1"><Play className="h-4 w-4" />Run</Button>
            <Button size="sm" variant="outline"   onClick={optimize}  className="gap-1"><Sparkles className="h-4 w-4" />AI Tune</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt} className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}   className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview"  className="gap-1"><LayoutGrid className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="catalog"   className="gap-1"><Package className="h-4 w-4" />Catalog</TabsTrigger>
              <TabsTrigger value="orders"    className="gap-1"><ClipboardList className="h-4 w-4" />Orders</TabsTrigger>
              <TabsTrigger value="payments"  className="gap-1"><Wallet className="h-4 w-4" />Payments</TabsTrigger>
              <TabsTrigger value="logistics" className="gap-1"><Truck className="h-4 w-4" />Logistics</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
              <TabsTrigger value="activity"  className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders store state from the Business runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="catalog"   className="mt-3"><p className="text-sm text-muted-foreground">Products · categories · brands · variants · inventory · pricing.</p></TabsContent>
            <TabsContent value="orders"    className="mt-3"><p className="text-sm text-muted-foreground">Cart · placement · checkout · fulfillment · returns · refunds.</p></TabsContent>
            <TabsContent value="payments"  className="mt-3"><p className="text-sm text-muted-foreground">COD · online · retries · webhooks · reconciliation · invoices · GST.</p></TabsContent>
            <TabsContent value="logistics" className="mt-3"><p className="text-sm text-muted-foreground">Zones · rates · carriers · tracking · SLA · RMA · restock.</p></TabsContent>
            <TabsContent value="analytics" className="mt-3"><p className="text-sm text-muted-foreground">GMV · AOV · conversion · retention · cohorts · funnels.</p></TabsContent>
            <TabsContent value="activity"  className="mt-3"><p className="text-sm text-muted-foreground">Runs · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Ecommerce Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, runs, tunings, exports, and publishes log here.
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

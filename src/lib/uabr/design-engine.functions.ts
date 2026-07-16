/** R67 UABR — design engine (brand kit generator). */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUabrAccess } from "./gate";
import type { UabrDesignKit } from "./contracts";

const PALETTES: Record<string, { name: string; hex: string; role: string }[]> = {
  restaurant: [
    { name: "Ember", hex: "#B45309", role: "primary" },
    { name: "Cream", hex: "#FEF3C7", role: "surface" },
    { name: "Ink", hex: "#111827", role: "text" },
  ],
  hospital: [
    { name: "Care Blue", hex: "#0EA5E9", role: "primary" },
    { name: "Mint", hex: "#ECFEFF", role: "surface" },
    { name: "Ink", hex: "#0F172A", role: "text" },
  ],
  ecommerce: [
    { name: "Signal", hex: "#F97316", role: "primary" },
    { name: "Snow", hex: "#FAFAFA", role: "surface" },
    { name: "Ink", hex: "#0F172A", role: "text" },
  ],
  default: [
    { name: "Gold", hex: "#C7A24A", role: "primary" },
    { name: "Paper", hex: "#F5F1E8", role: "surface" },
    { name: "Ink", hex: "#111111", role: "text" },
  ],
};

export const generateDesignKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    brand_name: z.string().min(1).max(120),
    industry: z.string().max(60).default("default"),
    tone: z.enum(["premium", "friendly", "minimal", "playful", "corporate"]).default("premium"),
  }).parse(raw))
  .handler(async ({ context, data }): Promise<UabrDesignKit> => {
    await assertUabrAccess(context);
    const palette = PALETTES[data.industry] ?? PALETTES.default;
    return {
      brand_name: data.brand_name,
      logo_concept: `Wordmark of "${data.brand_name}" in ${data.tone} weight, paired with a monogram glyph.`,
      typography: data.tone === "premium"
        ? { heading: "Fraunces", body: "Inter" }
        : data.tone === "corporate"
        ? { heading: "Manrope", body: "Inter" }
        : { heading: "General Sans", body: "Inter" },
      palette,
      tokens: {
        "--radius": "12px",
        "--space-1": "4px",
        "--space-2": "8px",
        "--space-3": "12px",
        "--space-4": "16px",
        "--elev-1": "0 1px 2px rgba(0,0,0,.08)",
        "--elev-2": "0 6px 20px rgba(0,0,0,.10)",
      },
      wireframes: [
        { name: "Landing", sections: ["Hero", "Value props", "Social proof", "Feature grid", "Pricing", "CTA", "Footer"] },
        { name: "Dashboard", sections: ["Top bar", "Sidebar", "KPI row", "Chart", "Table", "Activity"] },
        { name: "Detail", sections: ["Breadcrumbs", "Header", "Tabs", "Content", "Side panel"] },
      ],
    };
  });

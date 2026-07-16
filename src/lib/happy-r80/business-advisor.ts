/**
 * R80 — Business Advisor (pure logic).
 * Rule-based suggestion engine over already-computed metrics. No AI calls
 * here — server function may combine this with Lovable AI for phrasing.
 */

export type BusinessMetrics = {
  conversionRate?: number;   // 0..1
  bounceRate?: number;       // 0..1
  avgOrderValue?: number;    // currency units
  monthlyRevenue?: number;
  monthlyRevenuePrev?: number;
  seoScore?: number;         // 0..100
  perfScore?: number;        // 0..100
  a11yScore?: number;        // 0..100
  cartAbandonRate?: number;  // 0..1
};

export type BusinessSuggestion = {
  area: "revenue" | "marketing" | "seo" | "ui" | "performance" | "conversion" | "opportunity";
  message: string;
  impact: "low" | "medium" | "high";
};

export function advise(m: BusinessMetrics): BusinessSuggestion[] {
  const out: BusinessSuggestion[] = [];
  if (m.conversionRate !== undefined && m.conversionRate < 0.02) {
    out.push({ area: "conversion", impact: "high", message: "Conversion is under 2%. Consider a leaner checkout and stronger CTAs." });
  }
  if (m.bounceRate !== undefined && m.bounceRate > 0.6) {
    out.push({ area: "ui", impact: "medium", message: "Bounce rate is high — the hero may not match visitor intent." });
  }
  if (m.cartAbandonRate !== undefined && m.cartAbandonRate > 0.5) {
    out.push({ area: "revenue", impact: "high", message: "Cart abandonment is above 50%. Try one-tap checkout and a recovery email." });
  }
  if (m.seoScore !== undefined && m.seoScore < 70) {
    out.push({ area: "seo", impact: "medium", message: "SEO score is under 70. Refresh titles, meta descriptions, and internal linking." });
  }
  if (m.perfScore !== undefined && m.perfScore < 70) {
    out.push({ area: "performance", impact: "medium", message: "Performance is under 70. Compress hero assets and lazy-load below-the-fold." });
  }
  if (m.a11yScore !== undefined && m.a11yScore < 80) {
    out.push({ area: "ui", impact: "medium", message: "Accessibility is below 80. Fix contrast, labels, and focus states first." });
  }
  if (m.monthlyRevenue !== undefined && m.monthlyRevenuePrev !== undefined && m.monthlyRevenuePrev > 0) {
    const change = (m.monthlyRevenue - m.monthlyRevenuePrev) / m.monthlyRevenuePrev;
    if (change < -0.1) out.push({ area: "revenue", impact: "high", message: `Revenue is down ${Math.round(-change * 100)}% MoM. Investigate top channels.` });
    else if (change > 0.2) out.push({ area: "opportunity", impact: "medium", message: `Revenue is up ${Math.round(change * 100)}% MoM — double down on the working channel.` });
  }
  return out.sort((a, b) => impactRank(b.impact) - impactRank(a.impact));
}

function impactRank(i: BusinessSuggestion["impact"]): number {
  return i === "high" ? 3 : i === "medium" ? 2 : 1;
}

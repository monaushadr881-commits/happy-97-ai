/** HAPPY UVE v4.0 — Theme Marketplace (stub). */
import { createServerFn } from "@tanstack/react-start";

export interface MarketplaceTheme {
  id: string;
  name: string;
  author: string;
  price: number;
  currency: "USD" | "INR" | "EUR";
  rating: number;
  installs: number;
  premium: boolean;
}

export const MARKETPLACE_THEMES: MarketplaceTheme[] = [
  { id: "aurora-dynamic", name: "Aurora Dynamic", author: "HAPPY Studio", price: 0, currency: "USD", rating: 4.9, installs: 128_400, premium: false },
  { id: "executive-dark", name: "Executive Dark", author: "HAPPY Studio", price: 0, currency: "USD", rating: 4.8, installs: 96_120, premium: false },
  { id: "glass-crystal", name: "Glass Crystal", author: "HAPPY Studio", price: 12, currency: "USD", rating: 4.9, installs: 21_300, premium: true },
  { id: "cyber-neon", name: "Cyber Neon", author: "HAPPY Studio", price: 9, currency: "USD", rating: 4.7, installs: 18_900, premium: true },
  { id: "royal-crimson", name: "Royal Crimson", author: "HAPPY Studio", price: 9, currency: "USD", rating: 4.6, installs: 11_050, premium: true },
];

export const listMarketplaceThemes = createServerFn({ method: "GET" }).handler(async () => ({
  themes: MARKETPLACE_THEMES,
}));

/** HAPPY UUE v5.0 — Widget platform (stub). */
import { createServerFn } from "@tanstack/react-start";

export interface Widget {
  id: string;
  name: string;
  category: "productivity" | "market" | "life" | "founder" | "ai";
}

export const WIDGETS: Widget[] = [
  { id: "weather", name: "Weather", category: "life" },
  { id: "calendar", name: "Calendar", category: "productivity" },
  { id: "tasks", name: "Tasks", category: "productivity" },
  { id: "goals", name: "Goals", category: "productivity" },
  { id: "analytics", name: "Analytics", category: "founder" },
  { id: "revenue", name: "Revenue", category: "founder" },
  { id: "stocks", name: "Stocks", category: "market" },
  { id: "crypto", name: "Crypto", category: "market" },
  { id: "news", name: "News", category: "life" },
  { id: "founder-signals", name: "Founder Signals", category: "founder" },
  { id: "ai-pulse", name: "AI Pulse", category: "ai" },
];

export const listWidgets = createServerFn({ method: "GET" }).handler(async () => ({ widgets: WIDGETS }));

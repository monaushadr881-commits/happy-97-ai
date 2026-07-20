/**
 * MissionControl presentational utilities.
 * Extracted verbatim from src/components/founder/MissionControl.tsx (R195-B8).
 * Pure functions — safe to import in any memoized panel.
 */
import type { founderMissionControl } from "@/lib/founder/mission-control.functions";

export type MCData = NonNullable<Awaited<ReturnType<typeof founderMissionControl>>>;

export type Tone =
  | "success" | "warning" | "danger" | "info" | "gold" | "neutral";

export function fmt(n: number | null | undefined) {
  return typeof n === "number" ? n.toLocaleString() : "—";
}

export function money(cents: number, ccy = "INR") {
  const n = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${ccy} ${n.toFixed(0)}`;
  }
}

export function ago(iso?: string | null) {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

export function statusTone(s: string): Tone {
  switch (s) {
    case "approved":
    case "succeeded":
    case "healthy":
    case "paid":
    case "completed":
    case "active":
      return "success";
    case "pending":
    case "queued":
    case "running":
    case "issued":
    case "degraded":
      return "warning";
    case "rejected":
    case "failed":
    case "down":
    case "unhealthy":
    case "overdue":
      return "danger";
    case "cancelled":
    case "draft":
      return "neutral";
    default:
      return "info";
  }
}

/**
 * HAPPY X — Design System Primitives
 * Composable, token-driven layout & content primitives used across every module.
 * Do NOT introduce raw hex colors in modules — compose these primitives instead.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* -------- Section: consistent vertical rhythm for page bands -------- */
export const Section = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <section
      ref={ref}
      className={cn("relative py-16 md:py-24", className)}
      {...props}
    />
  ),
);
Section.displayName = "Section";

/* -------- Container: max-width & gutters -------- */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-6 md:px-10", className)}
      {...props}
    />
  );
}

/* -------- Eyebrow: signature label above headings -------- */
export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("eyebrow", className)} {...props} />;
}

/* -------- Hairline: signature gold divider -------- */
export function Hairline({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("hairline w-full", className)} {...props} />;
}

/* -------- Panel: primary surface for content -------- */
type PanelProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "glass";
  interactive?: boolean;
};
export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant = "default", interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variant === "default" && "surface-card",
        variant === "elevated" && "surface-elevated",
        variant === "glass" && "glass-panel rounded-lg",
        interactive &&
          "transition-all duration-[var(--duration-base)] ease-[var(--ease-emphasized)] hover:-translate-y-0.5 hover:border-gold/25",
        className,
      )}
      {...props}
    />
  ),
);
Panel.displayName = "Panel";

/* -------- PageHeader: standard header pattern for dashboards -------- */
type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 pb-8",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-3 block">{eyebrow}</Eyebrow>}
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-paper">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm md:text-base text-soft-gray">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/* -------- StatCard: KPI tile used across every dashboard -------- */
type StatCardProps = {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: ReactNode;
  className?: string;
};
export function StatCard({
  label,
  value,
  delta,
  trend = "flat",
  icon,
  className,
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-danger"
        : "text-soft-gray";
  return (
    <Panel className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.2em] text-soft-gray/80">
          {label}
        </span>
        {icon && <span className="text-gold/80">{icon}</span>}
      </div>
      <div className="mt-3 numeric text-3xl text-paper">{value}</div>
      {delta && (
        <div className={cn("mt-2 text-xs numeric", trendColor)}>{delta}</div>
      )}
    </Panel>
  );
}

/* -------- EmptyState -------- */
type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-gold/15 p-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-gold/10 text-gold">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-paper">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-soft-gray">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* -------- Kbd: keyboard hint chip -------- */
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/10 bg-graphite px-1.5 text-[10px] font-medium text-soft-gray",
        className,
      )}
      {...props}
    />
  );
}

/* -------- Chip: compact status token -------- */
type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "gold" | "success" | "warning" | "danger" | "info";
};
export function Chip({ className, tone = "neutral", ...props }: ChipProps) {
  const tones: Record<NonNullable<ChipProps["tone"]>, string> = {
    neutral: "bg-white/5 text-soft-gray border-white/10",
    gold: "bg-gold/10 text-gold border-gold/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-info/10 text-info border-info/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

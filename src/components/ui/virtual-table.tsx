/**
 * Canonical virtualized table — the ONLY virtualization surface in the repo.
 * Built on @tanstack/react-virtual. Reused by Orders, Dealers, Customers,
 * Audit, Memory Timeline, Experience Timeline, Manufacturing Batches, BI.
 *
 * Do NOT create a second virtualized table component.
 */
import { useRef, type ReactNode, type CSSProperties } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

export interface VirtualTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  width?: number | string;
  className?: string;
  headerClassName?: string;
}

export interface VirtualTableProps<T> {
  rows: readonly T[];
  columns: readonly VirtualTableColumn<T>[];
  rowHeight?: number;
  overscan?: number;
  height?: number | string;
  getRowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  empty?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function VirtualTable<T>({
  rows,
  columns,
  rowHeight = 44,
  overscan = 8,
  height = 480,
  getRowKey,
  onRowClick,
  empty = "No rows",
  className,
  ariaLabel,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const gridTemplate = columns
    .map((c) => (typeof c.width === "number" ? `${c.width}px` : c.width ?? "1fr"))
    .join(" ");
  const gridStyle: CSSProperties = { gridTemplateColumns: gridTemplate };

  return (
    <div
      className={cn("w-full rounded-md border bg-card text-card-foreground", className)}
      role="table"
      aria-label={ariaLabel}
    >
      <div
        role="row"
        className="grid border-b bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        style={gridStyle}
      >
        {columns.map((c) => (
          <div
            key={c.key}
            role="columnheader"
            className={cn("px-3 py-2 truncate", c.headerClassName)}
          >
            {c.header}
          </div>
        ))}
      </div>

      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            {empty}
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((vi) => {
              const row = rows[vi.index];
              const key = getRowKey ? getRowKey(row, vi.index) : vi.index;
              return (
                <div
                  key={key}
                  role="row"
                  data-index={vi.index}
                  onClick={onRowClick ? () => onRowClick(row, vi.index) : undefined}
                  className={cn(
                    "grid items-center border-b text-sm",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                  )}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${vi.size}px`,
                    transform: `translateY(${vi.start}px)`,
                    ...gridStyle,
                  }}
                >
                  {columns.map((c) => (
                    <div key={c.key} className={cn("px-3 py-2 truncate", c.className)}>
                      {c.cell(row, vi.index)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

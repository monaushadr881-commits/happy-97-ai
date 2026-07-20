/**
 * Canonical Suspense/loader helper — the ONLY query-wrapper surface in the repo.
 *
 * Pattern:
 *   const opts = definedQuery(["bi", "kpis", scope], () => biGetKpis({ data: { scope } }));
 *
 *   // In a route:
 *   loader: ({ context }) => context.queryClient.ensureQueryData(opts),
 *   component: () => {
 *     const { data } = useSuspenseQuery(opts);
 *   }
 *
 * Do NOT create duplicate query wrappers.
 */
import {
  queryOptions,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";

export interface CanonicalQueryConfig {
  /** Stale time in ms. Default: 30s. */
  staleTime?: number;
  /** GC time in ms. Default: 5m. */
  gcTime?: number;
}

/**
 * Canonical query descriptor. Reuse existing stable query keys — do not invent new ones.
 */
export function definedQuery<TData>(
  key: QueryKey,
  fetcher: () => Promise<TData>,
  config: CanonicalQueryConfig = {},
) {
  return queryOptions({
    queryKey: key,
    queryFn: fetcher,
    staleTime: config.staleTime ?? 30_000,
    gcTime: config.gcTime ?? 5 * 60_000,
  });
}

// Loose shape for helpers that accept any `definedQuery` result without
// collapsing its generic parameter to `unknown` at the call site.
type AnyQueryOptions = Parameters<QueryClient["ensureQueryData"]>[0];

/**
 * Canonical loader helper. Use inside a route's `loader`.
 */
export function ensureCanonical<TData>(
  queryClient: QueryClient,
  opts: ReturnType<typeof definedQuery<TData>>,
): Promise<TData> {
  return queryClient.ensureQueryData(opts);
}

/**
 * Prime multiple queries in parallel from a loader without blocking on non-critical reads.
 * Awaits `critical`; fires `deferred` without awaiting.
 */
export async function ensureCanonicalMany(
  queryClient: QueryClient,
  critical: readonly AnyQueryOptions[],
  deferred: readonly AnyQueryOptions[] = [],
): Promise<void> {
  for (const q of deferred) void queryClient.prefetchQuery(q);
  await Promise.all(critical.map((q) => queryClient.ensureQueryData(q)));
}

export { queryOptions };

/** Shared adapter primitives. */

export class AdapterNotConfiguredError extends Error {
  constructor(public adapter: string, public missing: string[]) {
    super(
      `Adapter "${adapter}" is not configured. Missing env: ${missing.join(", ")}`
    );
    this.name = "AdapterNotConfiguredError";
  }
}

export interface AdapterStatus {
  id: string;
  configured: boolean;
  missing: string[];
}

/** Read an env var from process.env (server) or import.meta.env (client). */
export function env(name: string): string | undefined {
  const p =
    typeof process !== "undefined" && (process as any).env
      ? (process as any).env[name]
      : undefined;
  if (p) return p;
  try {
    const m = (import.meta as any)?.env;
    return m ? m[name] ?? m[`VITE_${name}`] : undefined;
  } catch {
    return undefined;
  }
}

export function requireEnv(adapter: string, names: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const n of names) {
    const v = env(n);
    if (!v) missing.push(n);
    else out[n] = v;
  }
  if (missing.length) throw new AdapterNotConfiguredError(adapter, missing);
  return out;
}

export function checkEnv(names: string[]): { configured: boolean; missing: string[] } {
  const missing = names.filter((n) => !env(n));
  return { configured: missing.length === 0, missing };
}

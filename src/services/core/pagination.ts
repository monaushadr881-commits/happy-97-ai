/**
 * HAPPY X — Service Layer: Pagination helpers
 *
 * Standardized cursor + offset pagination shapes.
 */

export interface Page<T> {
  items: T[];
  nextCursor?: string;
  total?: number;
}

export function encodeCursor(v: { ts: string; id: string }): string {
  return Buffer.from(JSON.stringify(v)).toString("base64url");
}

export function decodeCursor(c?: string): { ts: string; id: string } | undefined {
  if (!c) return undefined;
  try {
    return JSON.parse(Buffer.from(c, "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
}

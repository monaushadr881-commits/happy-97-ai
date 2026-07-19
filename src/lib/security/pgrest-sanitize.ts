/**
 * R106 — PostgREST filter sanitizer.
 *
 * PostgREST's `.or()` / `.filter()` grammar uses `,` `.` `(` `)` `:` `*` as
 * structural tokens. Interpolating raw user input into an `.or("col.ilike.<q>")`
 * string lets a caller inject extra filter clauses. This helper strips both
 * SQL LIKE wildcards (`%`, `_`) AND the PostgREST-reserved characters so the
 * resulting string is only ever a literal ILIKE fragment.
 *
 * Usage:
 *   const q = `%${sanitizePgRestLike(userInput)}%`;
 *   qb.or(`name.ilike.${q},email.ilike.${q}`)
 */
export function sanitizePgRestLike(input: string, maxLen = 120): string {
  return (input ?? "")
    .toString()
    .slice(0, maxLen)
    // Remove SQL LIKE wildcards and PostgREST filter-grammar tokens.
    .replace(/[%_,.():*"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Assert a string is a canonical UUID before interpolating it into a
 * PostgREST `.or()` / `.filter()` fragment. Throws on invalid input so
 * callers never splice attacker-controlled tokens into the filter grammar.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function assertUuid(input: unknown, field = "id"): string {
  if (typeof input !== "string" || !UUID_RE.test(input)) {
    throw new Error(`invalid_uuid:${field}`);
  }
  return input;
}

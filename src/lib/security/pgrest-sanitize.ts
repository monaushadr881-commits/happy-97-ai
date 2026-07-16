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

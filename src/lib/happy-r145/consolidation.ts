/**
 * R145 · Consolidation Execution registry helpers
 *
 * Small pure functions the scanners / registries use to skip
 * `src/lib/_archive/**`. Duplicates the intent of R144's
 * `scanForDuplicateRuntimes`, extended with archive-path awareness.
 * No new runtime. No new cache. No new API.
 */

export const R145_ARCHIVE_ROOT = "src/lib/_archive/";

/** True if a project-relative path lives under the archive root. */
export function isArchivedPath(path: string): boolean {
  const p = path.replace(/^\.\/+/, "");
  return p.startsWith(R145_ARCHIVE_ROOT);
}

/** Filter out any archived paths — used by registry scanners. */
export function filterArchived<T extends string>(paths: T[]): T[] {
  return paths.filter((p) => !isArchivedPath(p));
}

/** Detect imports that reach into the archive (forbidden). */
export function hasArchiveImport(sourceText: string): boolean {
  return /['"]@\/lib\/_archive\/|['"]\.\.?\/_archive\//.test(sourceText);
}

/** Structured verdict for a single source file. */
export interface ArchiveGuardVerdict {
  path: string;
  ok: boolean;
  reason: string;
}

export function guardArchiveImports(
  files: { path: string; text: string }[],
): ArchiveGuardVerdict[] {
  return files.map((f) => {
    if (isArchivedPath(f.path)) {
      return { path: f.path, ok: true, reason: "self-archived (allowed)" };
    }
    if (hasArchiveImport(f.text)) {
      return {
        path: f.path,
        ok: false,
        reason: "R145 lock: imports from src/lib/_archive/** are forbidden",
      };
    }
    return { path: f.path, ok: true, reason: "clean" };
  });
}

/** Convenience: throw if any consumer imports from archive. */
export function assertNoArchiveImports(
  files: { path: string; text: string }[],
): void {
  const bad = guardArchiveImports(files).filter((v) => !v.ok);
  if (bad.length) {
    throw new Error(
      `R145 archive-import guard failed for ${bad.length} file(s): ` +
        bad.map((b) => b.path).join(", "),
    );
  }
}

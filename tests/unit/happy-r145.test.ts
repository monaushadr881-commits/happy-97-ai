import { describe, it, expect } from "vitest";
import {
  R145_ARCHIVE_ROOT,
  isArchivedPath,
  filterArchived,
  hasArchiveImport,
  guardArchiveImports,
  assertNoArchiveImports,
} from "@/lib/happy-r145/consolidation";

describe("R145 · Canonical Consolidation Execution", () => {
  it("archive root is src/lib/_archive/", () => {
    expect(R145_ARCHIVE_ROOT).toBe("src/lib/_archive/");
  });

  it("isArchivedPath recognises archive prefix and rejects canonical paths", () => {
    expect(isArchivedPath("src/lib/_archive/vN/foo.functions.ts")).toBe(true);
    expect(isArchivedPath("./src/lib/_archive/vN/x.ts")).toBe(true);
    expect(isArchivedPath("src/lib/brain/engine.ts")).toBe(false);
    expect(isArchivedPath("src/lib/happy-r144/performance.ts")).toBe(false);
  });

  it("filterArchived strips archived entries only", () => {
    const kept = filterArchived([
      "src/lib/_archive/vN/x.ts",
      "src/lib/brain/engine.ts",
    ]);
    expect(kept).toEqual(["src/lib/brain/engine.ts"]);
  });

  it("hasArchiveImport detects forbidden import paths", () => {
    expect(hasArchiveImport('import x from "@/lib/_archive/vN/foo"')).toBe(true);
    expect(hasArchiveImport('import x from "../_archive/foo"')).toBe(true);
    expect(hasArchiveImport('import x from "@/lib/brain/engine"')).toBe(false);
  });

  it("guardArchiveImports flags consumers but allows self-archived files", () => {
    const verdicts = guardArchiveImports([
      { path: "src/routes/x.tsx", text: 'import y from "@/lib/_archive/vN/y"' },
      { path: "src/routes/y.tsx", text: 'import y from "@/lib/brain/engine"' },
      { path: "src/lib/_archive/vN/z.ts", text: 'import a from "@/lib/_archive/vN/a"' },
    ]);
    expect(verdicts[0].ok).toBe(false);
    expect(verdicts[1].ok).toBe(true);
    expect(verdicts[2].ok).toBe(true);
  });

  it("assertNoArchiveImports throws on any bad consumer", () => {
    expect(() =>
      assertNoArchiveImports([
        { path: "src/foo.ts", text: 'import x from "@/lib/_archive/vN/x"' },
      ]),
    ).toThrow(/R145 archive-import guard/);
    expect(() =>
      assertNoArchiveImports([
        { path: "src/foo.ts", text: 'import x from "@/lib/brain/engine"' },
      ]),
    ).not.toThrow();
  });
});

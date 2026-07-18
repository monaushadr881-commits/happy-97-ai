import { describe, it, expect } from "vitest";
import {
  IMPORT_FORMATS, EXPORT_FORMATS, IMPORT_STAGES, EXPORT_STAGES,
  isImportSupported, isExportSupported, planImport, planExport,
  auditImport, auditExport, fingerprint,
} from "@/lib/happy-r119/file-intelligence";

const ctx = { owner_id: "u1", workspace_id: "w1" };

describe("R137 Universal Import/Export Intelligence", () => {
  it("declares wide format coverage", () => {
    for (const f of ["csv","xlsx","pdf","docx","vrm","glb","gguf","apk","psd","fig","mp4","zip"])
      expect(isImportSupported(f)).toBe(true);
    for (const f of ["csv","xlsx","pdf","zip","workspace_backup","brain_memory_export"])
      expect(isExportSupported(f)).toBe(true);
    expect(IMPORT_FORMATS.length).toBeGreaterThan(40);
    expect(EXPORT_FORMATS.length).toBeGreaterThanOrEqual(18);
  });

  it("import pipeline runs all 16 stages and passes for a valid pdf", () => {
    const plan = planImport({
      file: { name: "report.pdf", size: 5_000_000, lastModified: 1, mime: "application/pdf" },
      role: "member", isOwner: false, ctx, virusScanned: true,
    });
    expect(plan.stages.length).toBeGreaterThanOrEqual(IMPORT_STAGES.length);
    expect(plan.blocked).toBe(false);
    expect(plan.hint.cls).toBe("document");
    expect(plan.stages.find(s => s.stage === "ocr")?.status).toBe("ok");
  });

  it("blocks viewer without write capability", () => {
    const plan = planImport({
      file: { name: "a.csv", size: 100, lastModified: 1 },
      role: "viewer", isOwner: false, ctx,
    });
    expect(plan.blocked).toBe(true);
    expect(plan.stages.find(s => s.stage === "permission")?.status).toBe("block");
  });

  it("detects duplicates in import", () => {
    const existing = [fingerprint({ name: "a.csv", size: 100, lastModified: 1 })];
    const plan = planImport({
      file: { name: "a.csv", size: 100, lastModified: 1 },
      role: "admin", isOwner: true, ctx, existingFingerprints: existing,
    });
    expect(plan.duplicateOf).toBeTruthy();
    expect(plan.blocked).toBe(true);
  });

  it("enforces plan size cap", () => {
    const plan = planImport({
      file: { name: "huge.zip", size: 10_000_000_000, lastModified: 1 },
      role: "admin", isOwner: true, ctx, maxBytes: 100_000_000,
    });
    expect(plan.blocked).toBe(true);
    expect(plan.reason).toBe("size cap exceeded");
  });

  it("export pipeline runs 8 stages and produces filename", () => {
    const plan = planExport({
      format: "workspace_backup", role: "admin", isOwner: true, ctx,
      scope: "workspace", encrypt: true, itemCount: 42,
    });
    expect(plan.stages.length).toBe(EXPORT_STAGES.length);
    expect(plan.blocked).toBe(false);
    expect(plan.filename.endsWith(".zip")).toBe(true);
    expect(plan.stages.find(s => s.stage === "encryption")?.status).toBe("ok");
  });

  it("export blocks unsupported format", () => {
    const plan = planExport({
      format: "exe" as never, role: "admin", isOwner: true, ctx, scope: "single",
    });
    expect(plan.blocked).toBe(true);
  });

  it("emits audit events for import + export", () => {
    const imp = planImport({
      file: { name: "n.png", size: 10, lastModified: 1 },
      role: "member", isOwner: true, ctx,
    });
    const exp = planExport({ format: "csv", role: "member", isOwner: true, ctx, scope: "single" });
    const ai = auditImport(imp, "u1", ctx);
    const ae = auditExport(exp, "u1", ctx);
    expect(ai.kind).toBe("import");
    expect(ai.outcome).toBe("ok");
    expect(ae.kind).toBe("export");
    expect(ae.format).toBe("csv");
  });
});

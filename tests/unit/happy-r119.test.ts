import { describe, it, expect } from "vitest";
import {
  classifyFile, extOf, transferPolicyFor, fingerprint, fingerprintKey, isDuplicate,
  similarity, autoTags, pickUnderstanding, previewFor, nextVersion, diffVersions,
  canRead, canWrite, canDelete, newShareLink, resolveForBrain, normalizeQuery,
  emptyFileAnalytics,
} from "@/lib/happy-r119/file-intelligence";

describe("R119 File Intelligence", () => {
  it("classifies by extension and mime fallback", () => {
    expect(classifyFile("a.pdf")).toBe("document");
    expect(classifyFile("a.xlsx")).toBe("spreadsheet");
    expect(classifyFile("a.vrm")).toBe("3d");
    expect(classifyFile("a.gguf")).toBe("ai_model");
    expect(classifyFile("a.apk")).toBe("package");
    expect(classifyFile("noext", "image/heif")).toBe("image");
    expect(classifyFile("mystery")).toBe("binary");
    expect(extOf("archive.tar.gz")).toBe("gz");
  });

  it("scales transfer policy with file size and class", () => {
    const small = transferPolicyFor(5 * 1024 * 1024, "document");
    const huge  = transferPolicyFor(4 * 1024 * 1024 * 1024, "ai_model");
    expect(small.integrity).toBe("none");
    expect(huge.chunkBytes).toBeGreaterThan(small.chunkBytes);
    expect(huge.parallelChunks).toBeGreaterThan(small.parallelChunks);
    expect(huge.priority).toBe("high");
    expect(huge.integrity).toBe("sha256");
  });

  it("fingerprints and detects duplicates + similarity", () => {
    const a = fingerprint({ name: "report.pdf", size: 100, lastModified: 1 });
    const b = fingerprint({ name: "report.pdf", size: 100, lastModified: 1 });
    const c = fingerprint({ name: "report-v2.pdf", size: 105, lastModified: 2 });
    expect(fingerprintKey(a)).toBe(fingerprintKey(b));
    expect(isDuplicate(a, b)).toBe(true);
    expect(similarity(a, c)).toBeGreaterThan(0);
    expect(similarity(a, fingerprint({ name: "img.png", size: 100, lastModified: 1 }))).toBe(0);
  });

  it("auto-tags include class + ext", () => {
    const tags = autoTags("Quarterly-Report-Q3.pdf", "document");
    expect(tags).toContain("document");
    expect(tags).toContain("pdf");
    expect(tags).toContain("quarterly");
  });

  it("picks AI understanding + preview per class", () => {
    expect(pickUnderstanding("image")).toBe("image");
    expect(pickUnderstanding("video")).toBe("video_transcript");
    expect(previewFor("document", "pdf")).toBe("pdf");
    expect(previewFor("spreadsheet", "xlsx")).toBe("office");
    expect(previewFor("3d", "glb")).toBe("3d");
    expect(previewFor("binary", "bin")).toBe("hex");
  });

  it("versioning helpers", () => {
    const v1 = { version: 1, bucket: "b", path: "p", size: 100, checksum: "aa", created_at: "" };
    const v2 = { version: 2, bucket: "b", path: "p", size: 150, checksum: "bb", created_at: "" };
    expect(nextVersion([v1, v2])).toBe(3);
    const d = diffVersions(v1, v2);
    expect(d.sizeDelta).toBe(50);
    expect(d.checksumChanged).toBe(true);
  });

  it("permission gates", () => {
    expect(canRead("viewer", "private", false)).toBe(false);
    expect(canRead("viewer", "public", false)).toBe(true);
    expect(canRead("member", "workspace", false)).toBe(true);
    expect(canWrite("viewer", false)).toBe(false);
    expect(canWrite("member", false)).toBe(true);
    expect(canDelete("member", false)).toBe(false);
    expect(canDelete("admin", false)).toBe(true);
    expect(canDelete("viewer", true)).toBe(true); // owner
  });

  it("share links carry TTL + defaults", () => {
    const link = newShareLink(60);
    expect(link.allow_download).toBe(true);
    expect(link.allow_edit).toBe(false);
    expect(new Date(link.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it("resolveForBrain composes hint", () => {
    const hint = resolveForBrain("model.gguf", 4 * 1024 * 1024 * 1024, "application/octet-stream");
    expect(hint.cls).toBe("ai_model");
    expect(hint.transfer.priority).toBe("high");
    expect(hint.preview).toBe("hex");
    expect(hint.understanding).toBe("none");
  });

  it("normalizes search queries", () => {
    const n = normalizeQuery({ q: "  invoice ", tags: ["FINANCE"], limit: 9999 });
    expect(n.q).toBe("invoice");
    expect(n.tags).toEqual(["finance"]);
    expect(n.limit).toBe(200);
    expect(n.semantic).toBe(true);
  });

  it("provides empty analytics shape", () => {
    const a = emptyFileAnalytics();
    expect(a.uploads_30d).toBe(0);
    expect(a.storage_bytes).toBe(0);
  });
});

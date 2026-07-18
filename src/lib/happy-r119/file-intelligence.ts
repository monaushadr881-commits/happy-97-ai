/**
 * R119 — HAPPY Universal File Intelligence Engine™ (pure extension).
 *
 * Canonical owners (unchanged, reused):
 *   - Upload runtime : src/lib/happy-r112/files-upload.ts (resumable + chunked)
 *   - CMS engine     : src/lib/cms/engine.ts (cms_contents / cms_media)
 *   - Storage        : Supabase Storage buckets
 *                      (happy-assets, creator-assets, cms-media, vrm-assets)
 *   - Tables         : cms_media, content_uploads, media_assets, creator_assets
 *   - Workspace map  : src/lib/happy-r118/workspace-intelligence.ts
 *
 * FOUNDER LOCK: no File Engine V2, no new bucket, no new upload runtime,
 * no new storage table, no new API. Everything below is a pure helper the
 * canonical owners can consume — classification, permissions, transfer
 * policy, preview matrix, search shape.
 */

import type { WorkspaceRole, Capability } from "@/lib/happy-r118/workspace-intelligence";
import { hasCapability } from "@/lib/happy-r118/workspace-intelligence";

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — Universal file support (classification)
// ─────────────────────────────────────────────────────────────────────────────
export type FileClass =
  | "document" | "spreadsheet" | "presentation" | "text" | "code" | "data"
  | "image" | "video" | "audio" | "archive" | "package" | "design"
  | "cad" | "3d" | "database" | "ai_model" | "binary";

const EXT_MAP: Record<string, FileClass> = {
  // documents
  pdf: "document", doc: "document", docx: "document", rtf: "document", odt: "document",
  // spreadsheets
  xls: "spreadsheet", xlsx: "spreadsheet", ods: "spreadsheet", csv: "spreadsheet", tsv: "spreadsheet",
  // presentations
  ppt: "presentation", pptx: "presentation", odp: "presentation", key: "presentation",
  // text / markup
  txt: "text", md: "text", markdown: "text", rst: "text",
  json: "data", xml: "data", yaml: "data", yml: "data", toml: "data",
  // code
  js: "code", ts: "code", tsx: "code", jsx: "code", py: "code", go: "code", rs: "code",
  java: "code", kt: "code", swift: "code", c: "code", cpp: "code", h: "code", cs: "code", rb: "code", php: "code", sh: "code", sql: "code",
  // images
  jpg: "image", jpeg: "image", png: "image", webp: "image", gif: "image", svg: "image", avif: "image", heic: "image", tiff: "image", bmp: "image",
  // video
  mp4: "video", mov: "video", mkv: "video", webm: "video", avi: "video", m4v: "video",
  // audio
  mp3: "audio", wav: "audio", m4a: "audio", ogg: "audio", flac: "audio", aac: "audio",
  // archives
  zip: "archive", rar: "archive", "7z": "archive", tar: "archive", gz: "archive", tgz: "archive", bz2: "archive", iso: "archive",
  // packages
  apk: "package", aab: "package", ipa: "package", dmg: "package", exe: "package", msi: "package", deb: "package", rpm: "package", appimage: "package",
  // design
  psd: "design", ai: "design", fig: "design", sketch: "design", xd: "design",
  // cad / 3d
  dwg: "cad", dxf: "cad",
  stl: "3d", obj: "3d", fbx: "3d", glb: "3d", gltf: "3d", vrm: "3d", usdz: "3d",
  // databases
  sqlite: "database", db: "database", sqlite3: "database", dump: "database",
  // ai models
  gguf: "ai_model", onnx: "ai_model", safetensors: "ai_model", pt: "ai_model", ckpt: "ai_model", bin: "ai_model",
};

export function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function classifyFile(name: string, mime?: string): FileClass {
  const ext = extOf(name);
  if (EXT_MAP[ext]) return EXT_MAP[ext];
  if (mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("text/")) return "text";
    if (mime === "application/pdf") return "document";
    if (mime === "application/zip") return "archive";
  }
  return "binary";
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4 — Transfer engine policy (extends happy-r112/files-upload.ts)
// ─────────────────────────────────────────────────────────────────────────────
export interface TransferPolicy {
  chunkBytes: number;
  parallelChunks: number;
  maxAttempts: number;
  backgroundOk: boolean;
  priority: "low" | "normal" | "high";
  integrity: "sha256" | "none";
}

const MB = 1024 * 1024;

export function transferPolicyFor(size: number, cls: FileClass): TransferPolicy {
  const large = size > 200 * MB;
  const huge  = size > 2 * 1024 * MB;
  return {
    chunkBytes: huge ? 32 * MB : large ? 16 * MB : 8 * MB,
    parallelChunks: huge ? 6 : large ? 4 : 2,
    maxAttempts: 5,
    backgroundOk: large,
    priority: cls === "ai_model" || cls === "package" || huge ? "high" : "normal",
    integrity: size > 10 * MB ? "sha256" : "none",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — File intelligence (metadata / dedup / similarity hints)
// ─────────────────────────────────────────────────────────────────────────────
export interface FileFingerprint {
  name: string;
  size: number;
  lastModified: number;
  cls: FileClass;
}

export function fingerprint(file: { name: string; size: number; lastModified: number }, mime?: string): FileFingerprint {
  return { name: file.name, size: file.size, lastModified: file.lastModified, cls: classifyFile(file.name, mime) };
}

export function fingerprintKey(fp: FileFingerprint): string {
  return `${fp.name}::${fp.size}::${fp.lastModified}`;
}

export function isDuplicate(a: FileFingerprint, b: FileFingerprint): boolean {
  return fingerprintKey(a) === fingerprintKey(b);
}

export function similarity(a: FileFingerprint, b: FileFingerprint): number {
  if (a.cls !== b.cls) return 0;
  const nameScore = a.name === b.name ? 0.5 : a.name.toLowerCase().split(/[^a-z0-9]/).some(t => t && b.name.toLowerCase().includes(t)) ? 0.3 : 0;
  const sizeScore = Math.max(a.size, b.size) === 0 ? 0 : 0.5 * (1 - Math.abs(a.size - b.size) / Math.max(a.size, b.size));
  return Math.min(1, nameScore + sizeScore);
}

export function autoTags(name: string, cls: FileClass): string[] {
  const base = new Set<string>([cls]);
  for (const tok of name.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2 && t.length < 20)) base.add(tok);
  const ext = extOf(name); if (ext) base.add(ext);
  return Array.from(base).slice(0, 12);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6 — AI understanding router (pure planner; execution stays in engines)
// ─────────────────────────────────────────────────────────────────────────────
export type AIUnderstandingKind =
  | "ocr" | "image" | "document" | "spreadsheet" | "presentation"
  | "video_transcript" | "audio_transcript" | "code" | "dataset" | "none";

export function pickUnderstanding(cls: FileClass): AIUnderstandingKind {
  switch (cls) {
    case "image":        return "image";
    case "document":     return "document";
    case "spreadsheet":  return "spreadsheet";
    case "presentation": return "presentation";
    case "video":        return "video_transcript";
    case "audio":        return "audio_transcript";
    case "code":         return "code";
    case "data":         return "dataset";
    case "text":         return "document";
    default:             return "none";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7 — Universal preview matrix
// ─────────────────────────────────────────────────────────────────────────────
export type PreviewMode =
  | "image" | "pdf" | "office" | "video" | "audio" | "markdown" | "code" | "3d" | "table" | "hex";

export function previewFor(cls: FileClass, ext: string): PreviewMode {
  if (cls === "image") return "image";
  if (ext === "pdf") return "pdf";
  if (["docx","doc","pptx","ppt","xlsx","xls","odt","ods","odp"].includes(ext)) return "office";
  if (cls === "video") return "video";
  if (cls === "audio") return "audio";
  if (["md","markdown","rst"].includes(ext)) return "markdown";
  if (cls === "code" || ["json","xml","yaml","yml","toml","txt"].includes(ext)) return "code";
  if (cls === "3d") return "3d";
  if (cls === "spreadsheet" || ["csv","tsv"].includes(ext)) return "table";
  return "hex";
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 8 — Version-control shape (extends cms_revisions)
// ─────────────────────────────────────────────────────────────────────────────
export interface FileVersion {
  version: number;
  bucket: string;
  path: string;
  size: number;
  checksum?: string;
  created_at: string;
  created_by?: string;
  note?: string;
}
export function nextVersion(prev: FileVersion[]): number {
  return prev.reduce((m, v) => Math.max(m, v.version), 0) + 1;
}
export function diffVersions(a: FileVersion, b: FileVersion): { sizeDelta: number; checksumChanged: boolean } {
  return { sizeDelta: b.size - a.size, checksumChanged: !!a.checksum && !!b.checksum && a.checksum !== b.checksum };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 9 — Permission model
// ─────────────────────────────────────────────────────────────────────────────
export type FileVisibility = "private" | "workspace" | "company" | "enterprise" | "shared" | "public";

export interface FileShareLink {
  token: string;
  expires_at: string;
  allow_download: boolean;
  allow_edit: boolean;
}

export function canRead(role: WorkspaceRole, visibility: FileVisibility, isOwner: boolean, custom?: Capability[]): boolean {
  if (isOwner) return true;
  if (visibility === "private") return false;
  if (visibility === "public") return true;
  return hasCapability(role, "workspace.read", custom) || hasCapability(role, "files.upload", custom);
}
export function canWrite(role: WorkspaceRole, isOwner: boolean, custom?: Capability[]): boolean {
  return isOwner || hasCapability(role, "workspace.write", custom);
}
export function canDelete(role: WorkspaceRole, isOwner: boolean, custom?: Capability[]): boolean {
  return isOwner || hasCapability(role, "files.delete", custom);
}
export function newShareLink(ttlSeconds = 3600, opts: Partial<FileShareLink> = {}): FileShareLink {
  return {
    token: Math.random().toString(36).slice(2) + Date.now().toString(36),
    expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    allow_download: opts.allow_download ?? true,
    allow_edit: opts.allow_edit ?? false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 10 — Brain integration hint
// ─────────────────────────────────────────────────────────────────────────────
export interface BrainFileHint {
  cls: FileClass;
  preview: PreviewMode;
  understanding: AIUnderstandingKind;
  tags: string[];
  transfer: TransferPolicy;
}
export function resolveForBrain(name: string, size: number, mime?: string): BrainFileHint {
  const cls = classifyFile(name, mime);
  const ext = extOf(name);
  const transfer = transferPolicyFor(size, cls);
  return {
    cls,
    preview: previewFor(cls, ext),
    understanding: pickUnderstanding(cls),
    tags: autoTags(name, cls),
    transfer,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 11 — Workspace linkage envelope (every file knows its context)
// ─────────────────────────────────────────────────────────────────────────────
export interface FileContext {
  workspace_id?: string;
  company_id?: string;
  brand_id?: string;
  project_id?: string;
  task_id?: string;
  conversation_id?: string;
  memory_id?: string;
  owner_id: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 12 — Search query shape (hybrid)
// ─────────────────────────────────────────────────────────────────────────────
export interface FileSearchQuery {
  q?: string;
  cls?: FileClass[];
  tags?: string[];
  workspace_id?: string;
  semantic?: boolean;
  ocr?: boolean;
  limit?: number;
}
export function normalizeQuery(q: FileSearchQuery): FileSearchQuery {
  return {
    q: q.q?.trim(),
    cls: q.cls?.length ? q.cls : undefined,
    tags: q.tags?.length ? q.tags.map(t => t.toLowerCase()) : undefined,
    workspace_id: q.workspace_id,
    semantic: q.semantic ?? !!q.q,
    ocr: q.ocr ?? false,
    limit: Math.min(200, Math.max(1, q.limit ?? 25)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 13 — Analytics snapshot shape
// ─────────────────────────────────────────────────────────────────────────────
export interface FileAnalytics {
  uploads_30d: number;
  downloads_30d: number;
  storage_bytes: number;
  transfer_bytes_30d: number;
  avg_transfer_mbps: number;
  duplicates: number;
  ai_calls_30d: number;
  ocr_calls_30d: number;
  search_calls_30d: number;
}
export function emptyFileAnalytics(): FileAnalytics {
  return {
    uploads_30d: 0, downloads_30d: 0, storage_bytes: 0, transfer_bytes_30d: 0,
    avg_transfer_mbps: 0, duplicates: 0,
    ai_calls_30d: 0, ocr_calls_30d: 0, search_calls_30d: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// R137 — Universal Import / Export Intelligence™ (pure extension)
// Extends this canonical File Engine. NO new import runtime, NO new export
// runtime, NO new storage. Every stage below is a pure planner/validator the
// existing runtimes (happy-r112 upload, cms/engine, brain, memory, workspace,
// search) consume. Execution stays in those canonical owners.
// ─────────────────────────────────────────────────────────────────────────────

export const IMPORT_FORMATS = [
  "csv","xls","xlsx","ods","pdf","doc","docx","ppt","pptx","txt","md","markdown","rtf",
  "json","xml","yaml","yml","zip","sqlite","sql",
  "jpg","jpeg","png","webp","gif","svg","avif","heic","tiff","bmp",
  "mp4","mov","mkv","webm","avi","m4v","mp3","wav","m4a","ogg","flac","aac",
  "psd","ai","fig",
  "vrm","glb","gltf","fbx","obj","stl","usdz",
  "apk","aab","ipa","gguf","onnx","safetensors","pt","ckpt","bin",
] as const;
export type ImportFormat = typeof IMPORT_FORMATS[number];

export const EXPORT_FORMATS = [
  "csv","xlsx","ods","pdf","docx","pptx","md","txt","json","xml","html","zip",
  "workspace_backup","company_backup","project_backup","conversation_backup",
  "brain_memory_export","settings_export",
] as const;
export type ExportFormat = typeof EXPORT_FORMATS[number];

export function isImportSupported(ext: string): boolean {
  return (IMPORT_FORMATS as readonly string[]).includes(ext.toLowerCase());
}
export function isExportSupported(fmt: string): boolean {
  return (EXPORT_FORMATS as readonly string[]).includes(fmt.toLowerCase());
}

// ── 16-stage IMPORT pipeline (pure planner) ─────────────────────────────────
export const IMPORT_STAGES = [
  "upload","validation","permission","virus_scan","classification","duplicate",
  "metadata","ocr","vision","transcript","ai_understanding",
  "workspace_routing","brain_context","memory_linking","search_index","storage",
] as const;
export type ImportStage = typeof IMPORT_STAGES[number];

export type StageStatus = "ok" | "skip" | "block" | "error";
export interface StageResult { stage: ImportStage | ExportStage; status: StageStatus; note?: string }

export interface ImportRequest {
  file: { name: string; size: number; lastModified: number; mime?: string };
  role: WorkspaceRole;
  isOwner: boolean;
  ctx: FileContext;
  virusScanned?: boolean;
  existingFingerprints?: FileFingerprint[];
  maxBytes?: number;
}

export interface ImportPlan {
  hint: BrainFileHint;
  fingerprint: FileFingerprint;
  duplicateOf?: FileFingerprint;
  stages: StageResult[];
  blocked: boolean;
  reason?: string;
}

export function planImport(req: ImportRequest): ImportPlan {
  const { file, role, isOwner, ctx } = req;
  const hint = resolveForBrain(file.name, file.size, file.mime);
  const fp = fingerprint(file, file.mime);
  const stages: StageResult[] = [];
  const push = (stage: ImportStage, status: StageStatus, note?: string) => stages.push({ stage, status, note });

  push("upload", "ok");

  const ext = extOf(file.name);
  if (!ext) push("validation", "block", "no extension");
  else push("validation", "ok", isImportSupported(ext) ? undefined : "generic binary");
  if (req.maxBytes != null && file.size > req.maxBytes) push("validation", "block", "size cap exceeded");

  const writable = canWrite(role, isOwner);
  push("permission", writable ? "ok" : "block", writable ? undefined : "no write capability");

  push("virus_scan", req.virusScanned == null ? "skip" : req.virusScanned ? "ok" : "block");

  push("classification", "ok", hint.cls);

  const dup = (req.existingFingerprints ?? []).find(f => isDuplicate(f, fp));
  push("duplicate", dup ? "block" : "ok", dup ? "duplicate" : undefined);

  push("metadata", "ok");
  push("ocr", (hint.cls === "image" || (hint.cls === "document" && ext === "pdf")) ? "ok" : "skip");
  push("vision", hint.cls === "image" ? "ok" : "skip");
  push("transcript", (hint.cls === "video" || hint.cls === "audio") ? "ok" : "skip");
  push("ai_understanding", hint.understanding === "none" ? "skip" : "ok", hint.understanding);

  push("workspace_routing", ctx.workspace_id ? "ok" : "skip");
  push("brain_context", "ok");
  push("memory_linking", ctx.memory_id || ctx.conversation_id ? "ok" : "skip");
  push("search_index", "ok");
  push("storage", writable && !dup ? "ok" : "block");

  const blocked = stages.some(s => s.status === "block");
  const reason = stages.find(s => s.status === "block")?.note;
  return { hint, fingerprint: fp, duplicateOf: dup, stages, blocked, reason };
}

// ── 8-stage EXPORT pipeline (pure planner) ──────────────────────────────────
export const EXPORT_STAGES = [
  "permission","workspace_resolution","relationship_resolution",
  "packaging","compression","encryption","audit","download",
] as const;
export type ExportStage = typeof EXPORT_STAGES[number];

export interface ExportRequest {
  format: ExportFormat;
  role: WorkspaceRole;
  isOwner: boolean;
  ctx: FileContext;
  encrypt?: boolean;
  compress?: boolean;
  scope?: "single" | "workspace" | "company" | "project" | "conversation" | "brain" | "settings";
  itemCount?: number;
}

export interface ExportPlan {
  format: ExportFormat;
  stages: StageResult[];
  blocked: boolean;
  reason?: string;
  filename: string;
}

export function planExport(req: ExportRequest): ExportPlan {
  const stages: StageResult[] = [];
  const push = (stage: ExportStage, status: StageStatus, note?: string) => stages.push({ stage, status, note });

  const readable = req.isOwner || hasCapability(req.role, "workspace.read");
  push("permission", readable ? "ok" : "block", readable ? undefined : "no read capability");
  push("workspace_resolution", req.ctx.workspace_id ? "ok" : req.scope === "single" ? "skip" : "ok");
  push("relationship_resolution", (req.itemCount ?? 1) > 0 ? "ok" : "skip");
  push("packaging", isExportSupported(req.format) ? "ok" : "block", req.format);
  push("compression", req.compress || req.format === "zip" || (req.itemCount ?? 1) > 1 ? "ok" : "skip");
  push("encryption", req.encrypt ? "ok" : "skip");
  push("audit", "ok");
  push("download", readable && isExportSupported(req.format) ? "ok" : "block");

  const blocked = stages.some(s => s.status === "block");
  const reason = stages.find(s => s.status === "block")?.note;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const isBundle = req.format === "zip" || req.format.endsWith("_backup") || req.format.endsWith("_export");
  const filename = `${req.scope ?? "export"}-${stamp}.${isBundle ? "zip" : req.format}`;
  return { format: req.format, stages, blocked, reason, filename };
}

// ── Audit envelope (consumed by services/domain/audit.service.ts) ───────────
export interface FileAuditEvent {
  kind: "import" | "export";
  actor: string;
  at: string;
  format?: string;
  bytes?: number;
  workspace_id?: string;
  company_id?: string;
  outcome: "ok" | "blocked" | "error";
  reason?: string;
}
export function auditImport(plan: ImportPlan, actor: string, ctx: FileContext): FileAuditEvent {
  return {
    kind: "import", actor, at: new Date().toISOString(),
    format: extOf(plan.fingerprint.name), bytes: plan.fingerprint.size,
    workspace_id: ctx.workspace_id, company_id: ctx.company_id,
    outcome: plan.blocked ? "blocked" : "ok", reason: plan.reason,
  };
}
export function auditExport(plan: ExportPlan, actor: string, ctx: FileContext): FileAuditEvent {
  return {
    kind: "export", actor, at: new Date().toISOString(),
    format: plan.format,
    workspace_id: ctx.workspace_id, company_id: ctx.company_id,
    outcome: plan.blocked ? "blocked" : "ok", reason: plan.reason,
  };
}


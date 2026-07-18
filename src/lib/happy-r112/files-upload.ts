/**
 * R112 — Resumable / streaming upload extension.
 *
 * Extends existing storage buckets (happy-assets, creator-assets,
 * cms-media, vrm-assets). NO new bucket, NO new storage system.
 *
 * Rules (Founder Mission):
 *   - No hard-coded software limit; deployment config decides.
 *   - Chunked upload with pause / resume / retry.
 *   - Background continuation across page navigations (uses IndexedDB
 *     token; hook is provided, storage adapter injected by caller).
 *   - Supports any binary (ZIP/RAR/7Z/ISO/APK/PSD/AI/FIG/CAD/PDF/Office/
 *     Video/Audio/Source/DB/AI-models). Type is not restricted here.
 */

export const DEFAULT_CHUNK_BYTES = 8 * 1024 * 1024; // 8 MiB

export type UploadState =
  | "pending" | "uploading" | "paused" | "retrying" | "done" | "error";

export type UploadTicket = {
  id: string;             // deterministic upload id (hash of path+size+mtime)
  bucket: string;
  path: string;           // "<uid>/<folder>/<file>"
  size: number;
  chunkBytes: number;
  uploadedBytes: number;
  state: UploadState;
  attempts: number;
  lastError?: string;
};

export function makeTicket(input: {
  id: string;
  bucket: string;
  path: string;
  size: number;
  chunkBytes?: number;
}): UploadTicket {
  return {
    id: input.id,
    bucket: input.bucket,
    path: input.path,
    size: input.size,
    chunkBytes: input.chunkBytes ?? DEFAULT_CHUNK_BYTES,
    uploadedBytes: 0,
    state: "pending",
    attempts: 0,
  };
}

export function nextChunkRange(t: UploadTicket): { start: number; end: number } | null {
  if (t.uploadedBytes >= t.size) return null;
  const start = t.uploadedBytes;
  const end = Math.min(t.size, start + t.chunkBytes);
  return { start, end };
}

export function shouldRetry(t: UploadTicket, maxAttempts = 5): boolean {
  return t.state === "error" && t.attempts < maxAttempts;
}

export function progressPct(t: UploadTicket): number {
  if (t.size <= 0) return 0;
  return Math.min(100, Math.floor((t.uploadedBytes / t.size) * 100));
}

/** Deterministic ID so pause/resume across sessions targets the same object. */
export function deriveUploadId(file: { name: string; size: number; lastModified: number }): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

/** R64 — artifact registry pure helpers. */
import type { ArtifactKind } from "./contracts";

const REQUIRE_SHA256: ArtifactKind[] = ["apk","aab","ipa","msix","exe","dmg","pkg","appimage","snap","flatpak","docker"];

export interface ArtifactValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateArtifactMetadata(input: {
  kind: ArtifactKind;
  filename: string;
  sha256?: string | null;
  size_bytes?: number | null;
  storage_url?: string | null;
}): ArtifactValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.filename || input.filename.length > 512) errors.push("filename required (<=512 chars)");
  if (REQUIRE_SHA256.includes(input.kind)) {
    if (!input.sha256) errors.push(`${input.kind} artifacts require sha256`);
    else if (!/^[a-f0-9]{64}$/i.test(input.sha256)) errors.push("sha256 must be 64 hex chars");
  }
  if (input.size_bytes != null && input.size_bytes < 0) errors.push("size_bytes must be >= 0");
  if (!input.storage_url) warnings.push("no storage_url — artifact is metadata-only until a bucket is provisioned");

  return { valid: errors.length === 0, errors, warnings };
}

export function extensionForKind(kind: ArtifactKind): string {
  switch (kind) {
    case "apk": return ".apk";
    case "aab": return ".aab";
    case "ipa": return ".ipa";
    case "msix": return ".msix";
    case "exe": return ".exe";
    case "dmg": return ".dmg";
    case "pkg": return ".pkg";
    case "appimage": return ".AppImage";
    case "snap": return ".snap";
    case "flatpak": return ".flatpak";
    case "docker": return ".tar";
    case "source": return ".tar.gz";
    case "sourcemap": return ".map";
    case "crash_symbol": return ".sym";
    case "debug_symbol": return ".dSYM";
    default: return "";
  }
}

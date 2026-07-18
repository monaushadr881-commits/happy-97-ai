# R119 — HAPPY Universal File Intelligence Engine™

**Status:** Delivered. Pure extension over the canonical File Engine.
**Canonical owners (reused, unchanged):**
- Upload runtime — `src/lib/happy-r112/files-upload.ts` (resumable/chunked)
- CMS engine — `src/lib/cms/engine.ts`
- Storage — Supabase Storage buckets: `happy-assets`, `creator-assets`, `cms-media`, `vrm-assets`
- Tables — `cms_media`, `cms_revisions`, `content_uploads`, `media_assets`, `creator_assets`
- Workspace map — `src/lib/happy-r118/workspace-intelligence.ts`

## Founder Lock
No File Engine V2. No new bucket. No new upload runtime. No duplicate
storage table. No new API. R119 adds a *pure intelligence layer* used by
canonical owners for classification, transfer policy, permissions, preview,
search, analytics.

## Gap Report (Phase 1)

| Area | Owner | Status | Notes |
|---|---|---|---|
| Upload / Resume / Chunk | `happy-r112/files-upload.ts` | ✅ canonical | R119 adds `transferPolicyFor()` sizing |
| Download / Streaming | Supabase Storage signed URLs | ✅ | reused |
| Storage buckets | happy-assets, creator-assets, cms-media, vrm-assets | ✅ | reused |
| Media rows | `cms_media`, `media_assets`, `creator_assets` | ✅ | reused |
| Content uploads | `content_uploads` | ✅ | reused |
| Versioning | `cms_revisions` | ✅ | R119 adds diff/version helpers |
| OCR / AI understanding | Lovable AI gateway | ✅ | R119 adds routing helper |
| Search | `search_tsv` + kg engine | ✅ | R119 adds query normalizer |
| Preview | UI-layer | ⚠ ad-hoc | R119 declares canonical `previewFor()` matrix |
| Classification / tags | scattered | ⚠ ad-hoc | consolidated in `classifyFile` + `autoTags` |
| Permissions | RLS + `authz.service.ts` + R118 caps | ✅ | R119 adds file-scoped hint |
| Analytics | `analytics.service.ts` | ✅ | R119 declares shape |

**Duplicates detected:** none created. Existing `files-upload.ts` is the sole
resumable upload owner; R119 sits above it.
**Performance risks:** none (pure O(1) helpers).
**Storage risks:** none (no bucket/table created).
**Security risks:** none. Permission helpers are advisory; RLS + `authz.service.ts`
remain enforcement.

## Architecture V2 (Phase 2)

```
File input (name/size/mime)
       │
       ▼
resolveForBrain() ── cls · preview · understanding · tags · transfer
       │
       ├─▶ happy-r112/files-upload.ts   (uses transfer policy)
       ├─▶ cms/engine.ts                (persists row + revisions)
       ├─▶ brain/engine.ts Stage 5–6    (knowledge/memory scoping)
       └─▶ analytics.service.ts         (FileAnalytics shape)
```

- **Storage model:** existing 4 Supabase buckets; path `<uid>/<folder>/<file>`.
- **Transfer model:** chunk size 8/16/32 MiB, parallelism 2/4/6, SHA-256 above 10 MiB.
- **Streaming:** upload = chunked PUT via `files-upload.ts`; download = signed URL, range-requestable.
- **Permission model:** 6 visibilities × R118 caps; time-limited share links.
- **Versioning model:** monotonic version numbers on `cms_revisions`; diff by size + checksum.
- **Retention:** existing bucket/table lifecycle rules — no new policy introduced by R119.

## Phase Mapping

- **P3 Universal support:** `classifyFile()` covers documents, spreadsheets, presentations, text/code/data, images, video, audio, archives, packages (APK/AAB/IPA/DMG/EXE/DEB/RPM), design (PSD/AI/FIG/XD), CAD/3D (STL/OBJ/FBX/GLB/GLTF/VRM/USDZ/DWG/DXF), databases (SQLite/SQL/DUMP), AI models (GGUF/ONNX/SAFETENSORS/PT/CKPT/BIN); MIME fallback for unknown extensions.
- **P4 Transfer engine:** `transferPolicyFor()` sizes chunk + parallelism + priority + integrity; pause/resume/retry live in `files-upload.ts`.
- **P5 Intelligence:** `fingerprint()`, `isDuplicate()`, `similarity()`, `autoTags()`.
- **P6 AI understanding:** `pickUnderstanding()` routes to OCR / image / doc / spreadsheet / presentation / video_transcript / audio_transcript / code / dataset.
- **P7 Preview matrix:** `previewFor()` → image/pdf/office/video/audio/markdown/code/3d/table/hex.
- **P8 Version control:** `nextVersion()`, `diffVersions()` over `cms_revisions`.
- **P9 Permissions:** `canRead()`, `canWrite()`, `canDelete()`, `newShareLink()`; 6 visibilities.
- **P10 Brain hook:** `resolveForBrain(name, size, mime)`.
- **P11 Workspace linkage:** `FileContext` envelope.
- **P12 Search:** `FileSearchQuery` + `normalizeQuery()` (semantic + ocr + hybrid).
- **P13 Analytics:** `FileAnalytics` + `emptyFileAnalytics()`.

## Files Changed
- `src/lib/happy-r119/file-intelligence.ts` — new pure helpers.
- `tests/unit/happy-r119.test.ts` — 11 tests passing.
- `docs/files/R119_FILE_INTELLIGENCE.md` — this document.

## Database / API Impact
None. Zero migrations. Zero new endpoints. Zero new buckets.

## Security Impact
None. RLS + `authz.service.ts` remain authoritative. Permission helpers are policy
hints for the UI/service layer.

## Performance Impact
Pure helpers, O(1). No I/O, no allocations beyond argument shape.

## Tests
`tests/unit/happy-r119.test.ts` — 11 cases green (classification, transfer,
fingerprint/similarity, tags, understanding, preview, version diff, permissions,
share links, brain hint, search normalizer, analytics shape).

## Registry Update
- FEATURE_REGISTRY → File Intelligence: **Delivered (R119)** via extension.
- TECHNICAL_REGISTRY → `src/lib/happy-r119/file-intelligence.ts` added.

## Known Limitations / Remaining Work
- Server-side OCR pipeline and video/audio transcript workers extend the AI
  Gateway routes — Future Phase, shapes are ready.
- Similarity beyond name+size (content-hash / perceptual) is Future Phase.
- Universal 3D/VRM preview reuses `HappyVRM` renderer; other 3D formats need
  a viewer component (Future Phase).
- Public bucket exposure gated by workspace `cloud_block_public_buckets` policy.

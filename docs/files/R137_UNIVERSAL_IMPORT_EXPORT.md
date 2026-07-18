# R137 — Universal Import / Export Intelligence™

**Status:** Delivered. Pure extension of canonical File Engine.
**Canonical owner (unchanged):** `src/lib/happy-r119/file-intelligence.ts`

## Founder Lock
No new import runtime, no new export runtime, no new storage, no new bucket,
no new table, no new API. R137 adds pure planner/validator helpers that the
existing runtimes (`happy-r112/files-upload.ts`, `cms/engine.ts`, Brain,
Memory, Workspace, Search) consume.

## Coverage

### Import formats (43)
csv · xls · xlsx · ods · pdf · doc · docx · ppt · pptx · txt · md · markdown ·
rtf · json · xml · yaml · yml · zip · sqlite · sql · jpg · jpeg · png · webp ·
gif · svg · avif · heic · tiff · bmp · mp4 · mov · mkv · webm · avi · m4v ·
mp3 · wav · m4a · ogg · flac · aac · psd · ai · fig · vrm · glb · gltf · fbx ·
obj · stl · usdz · apk · aab · ipa · gguf · onnx · safetensors · pt · ckpt · bin

### Export formats (18)
csv · xlsx · ods · pdf · docx · pptx · md · txt · json · xml · html · zip ·
workspace_backup · company_backup · project_backup · conversation_backup ·
brain_memory_export · settings_export

## Pipelines

### Import (16 stages)
upload → validation → permission → virus_scan → classification → duplicate →
metadata → ocr → vision → transcript → ai_understanding → workspace_routing →
brain_context → memory_linking → search_index → storage

### Export (8 stages)
permission → workspace_resolution → relationship_resolution → packaging →
compression → encryption → audit → download

## API
```ts
planImport(req: ImportRequest): ImportPlan
planExport(req: ExportRequest): ExportPlan
auditImport(plan, actor, ctx): FileAuditEvent
auditExport(plan, actor, ctx): FileAuditEvent
isImportSupported(ext) · isExportSupported(fmt)
IMPORT_FORMATS · EXPORT_FORMATS · IMPORT_STAGES · EXPORT_STAGES
```

Every stage returns `StageResult { stage, status: ok|skip|block|error, note }`.
`blocked` and `reason` roll up the first blocking stage.

## Integrations (consumers, unchanged)
- Brain → `resolveForBrain()` already emitted per file; import plan carries it.
- Memory → `memory_linking` stage flips on when `ctx.memory_id` / `conversation_id` present.
- Workspace → `workspace_routing` stage flips on when `ctx.workspace_id` present.
- Search → `search_index` stage always ok (index write happens in canonical search engine).
- Files → `storage` stage gated by `canWrite` + duplicate check.
- Business OS (CRM/ERP/HRMS/Inventory/Creator/Revenue/Enterprise/Founder) reuse the
  same planner via `ImportRequest.ctx` (company_id / project_id / brand_id).

## Security
- `permission` uses `canWrite` (import) / `canRead`+capability (export).
- `virus_scan` is a hook: `skip` when host runtime has no scanner, `block` on positive.
- Owner validation via `isOwner`.
- Workspace validation via `ctx.workspace_id`.
- Every import + export emits `FileAuditEvent` consumed by `services/domain/audit.service.ts`.

## Impact
- Database: **none** (0 migrations, 0 tables, 0 buckets).
- API: **none** (0 new routes; existing upload/download endpoints reused).
- Performance: pure O(n) over stage list — no I/O.
- Backward compatibility: additive-only; existing R119 API unchanged.

## Tests
`tests/unit/happy-r137.test.ts` — 8 cases green (formats, 16-stage plan, permission
block, duplicate detect, size cap, export plan + filename, unsupported format, audit).

## Registry Update
- FEATURE_REGISTRY → Universal Import/Export: **Delivered (R137)** via extension.
- TECHNICAL_REGISTRY → `src/lib/happy-r119/file-intelligence.ts` extended (no new file).

## Known Limitations / Remaining Gaps
- Actual virus scanner integration is external (hook only).
- OCR / vision / transcript execution happens in existing AI Gateway workers;
  R137 only declares the routing.
- Encryption at rest uses provider-level defaults; per-export passphrase UI is
  a future Creator/Enterprise UI task.
- Figma / PSD / AI deep parsing depends on external converter (future phase).

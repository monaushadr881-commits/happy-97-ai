# Phase 4 — Enterprise Database Architecture v1.0

The permanent production data foundation of the HAPPY X ecosystem. Built on top of
the Phase 2 tenancy core (companies · brands · workspaces · roles · permissions ·
employees · audit) using the same security-definer helpers.

## Column contract

Every domain table conforms to the standard contract:

| Column | Purpose |
| ------ | ------- |
| `id uuid PRIMARY KEY` | UUID v4 primary key |
| `company_id uuid`     | Tenant scoping (nullable only for platform-global rows) |
| `created_at`, `updated_at` | Timestamps (updated by `trg_touch_*` trigger) |
| `created_by`, `updated_by` | Actor tracking |
| `status`              | `record_status` enum: draft/active/archived/deleted/pending/suspended |
| `deleted_at`          | Soft delete |
| `version`             | Optimistic concurrency + versioning |
| `metadata jsonb`      | Extensible per-row payload |

Reference/high-throughput tables (ledger entries, chunks, reactions, queue) omit
mutable audit columns where they would add cost without value.

## Module inventory

| # | Domain            | Tables |
| - | ----------------- | ------ |
| 01 | User Preferences | `user_preferences` |
| 02 | AI Brain (pgvector) | `ai_personas` · `ai_sessions` · `ai_memories` · `ai_knowledge_documents` · `ai_knowledge_chunks` · `ai_missions` |
| 03 | Education | `courses` · `course_modules` · `lessons` · `course_enrollments` · `lesson_progress` · `assignments` · `assignment_submissions` · `quizzes` · `quiz_questions` · `quiz_attempts` · `certificates` |
| 04 | Knowledge Library | `knowledge_categories` · `knowledge_articles` (full-text search) · `knowledge_references` |
| 05 | CRM | `customers` · `leads` · `deals` |
| 06 | ERP | `product_categories` · `products` · `suppliers` · `warehouses` · `inventory_items` · `purchase_orders` · `purchase_order_items` · `sales_orders` · `sales_order_items` |
| 07 | Accounting | `chart_of_accounts` · `ledger_entries` · `tax_rates` · `invoices` · `invoice_items` · `payments` · `expenses` |
| 08 | Creator Studio | `creative_projects` · `creative_assets` |
| 09 | Community | `groups` · `group_memberships` · `posts` · `comments` · `reactions` · `follows` |
| 10 | Marketplace | `listings` · `listing_reviews` · `marketplace_transactions` |
| 11 | Notifications | `notifications` · `notification_preferences` |
| 12 | Media Library | `media_assets` |
| 13 | Integrations | `api_keys` · `webhooks` · `webhook_deliveries` · `integrations` |
| 14 | Automation | `workflows` · `workflow_runs` · `scheduled_jobs` · `job_queue` |
| 15 | Config | `feature_flags` · `remote_config` |
| 16 | Localization | `countries` · `currencies` · `languages` |
| 17 | Privacy | `consents` · `data_requests` |
| 18 | Versioning | `entity_versions` |

**Phase 4 total: 61 tables** — layered on top of the 20 Phase 2 tables (81 total).

## Security model

- **RLS** enabled on every table.
- **Tenant scoping** — company data reuses `is_company_member` (read) and
  `is_company_admin` (write); workspace data reuses `is_workspace_member`.
- **User-owned** — preferences, memories, sessions, notifications, consents,
  submissions, progress, reactions, follows scope to `auth.uid()`.
- **Public read** — `knowledge_articles`, `posts`, `listings`, `countries`,
  `currencies`, `languages` are readable by `anon` with explicit `SELECT ... TO
  anon` policies. All other tables require an authenticated session.
- **Least privilege** — each `CREATE TABLE` is followed by a scoped `GRANT`
  block. Admin/service_role has full access; `anon` only where a public
  policy exists.
- **Audit** — every mutation from the service layer calls the existing
  `write_audit()` helper; `audit_logs` is append-only via the immutability
  trigger from Phase 2.

## Performance strategy

- **Indexes** on hot paths: tenant + timestamp (`company_id, created_at DESC`),
  status filters (`WHERE deleted_at IS NULL`), foreign-key lookups
  (product/warehouse, invoice/company, ledger account/date, notification unread).
- **Full-text search** on `knowledge_articles.search_vector` via generated
  column + GIN index.
- **Vector search** on `ai_memories.embedding` and `ai_knowledge_chunks.embedding`
  (pgvector, dimension 1536 → OpenAI/Gemini embeddings). Add IVFFLAT/HNSW
  indexes when volume warrants (`v1.1`).
- **Partitioning** ready: `ledger_entries`, `audit_logs`, `activity_events`,
  `workflow_runs`, `job_queue`, `webhook_deliveries` are natural candidates
  for range partitioning by month once volume exceeds ~50M rows.
- **JSONB** metadata columns keep the core schema stable while allowing
  per-domain extension without migrations.

## Migration strategy

- One migration = one atomic change; every migration includes GRANT + RLS +
  policies in the same file.
- Domain enums are `CREATE TYPE IF NOT EXISTS` via `DO $$` blocks so
  migrations are idempotent.
- Helper `_hxp_attach_touch(regclass)` applies the `updated_at` trigger
  uniformly to every table; safe re-run.
- All migrations flow through the Lovable Cloud approval pipeline; direct
  psql is limited to read/insert.

## Backup & recovery

- Automated Supabase daily backups (managed by Lovable Cloud).
- Soft-deletes preserve rows for restore up to retention policy.
- `entity_versions` gives point-in-time snapshots per entity.
- Data-subject export handled via `data_requests` + async workflow that
  writes to `export_url`.

## Scalability

- All primary keys are UUID → shardable across regions.
- Tenant boundary (`company_id`) is present on every row that could grow →
  ready for row-security-driven read replicas or sharded databases.
- Stateless server functions + pg queue table (`job_queue`) support
  horizontal workers without in-memory coordination.

## Versioning

- Domain enums are additive (never removed).
- `version` column + `entity_versions` snapshots supply schema evolution
  without loss.
- Documentation is versioned alongside the migration files under
  `supabase/migrations/`.

## Future expansion

The following domains are on the roadmap and will slot in without breaking
changes:

- Religion & Culture library (extension of Knowledge with typed metadata).
- HRMS: payroll, leave, appraisals (extension of `employees`).
- Manufacturing BOM / routings / work orders.
- Wallet & Subscriptions (extension of Payments).
- Reviews & Ratings generalization across domains.
- Voice & 3D Avatar tables tied to `ai_personas`.
- Analytics rollup tables + materialized views per module.
- Full audit-log partitioning + cold-storage archive tables.

# HAPPY — Master Database

## Migrations (15)

Located in `supabase/migrations/` (timestamped `20260714*` foundation → `20260715092645*` R6 financial).

Latest two (R6):
- `20260715092531_*.sql` — plans, subscriptions, subscription_events, wallets, wallet_ledger_entries, credit_ledger_entries + views + immutability triggers
- `20260715092645_*.sql` — seeded 5 plans (Free/Starter/Pro/Business/Enterprise), GRANTs, RLS policies

## Table catalog (~115 tables)

See in-context `<supabase-tables>` block for full list with column counts. Grouped:

### Identity & access
- `profiles`, `user_roles`, `roles`, `role_assignments`, `role_permissions`, `permissions`, `api_keys`, `consents`, `data_requests`, `audit_logs`, `activity_events`

### Workspaces & tenancy
- `workspaces`, `workspace_memberships`, `companies`, `business_units`, `departments`, `offices`, `brands`, `teams`, `employees`

### Customers / CRM
- `customers`, `leads`, `deals`, `contacts (via profiles)`, `customer360 (view surfaces via customer.tsx)`

### Notifications
- `notifications`, `notification_preferences`

### Financial (R6)
- `plans`, `subscriptions`, `subscription_events` (immutable)
- `wallets`, `wallet_ledger_entries` (immutable), view `v_wallet_balances` (security_invoker)
- `credit_ledger_entries` (immutable), view `v_credit_balances` (security_invoker)

### Revenue / commerce (R5 baseline)
- `invoices`, `invoice_items`, `payments`, `products`, `product_categories`, `sales_orders`, `sales_order_items`, `purchase_orders`, `purchase_order_items`, `tax_rates`, `currencies`, `chart_of_accounts`, `ledger_entries`, `expenses`

### Marketplace / listings
- `listings`, `listing_reviews`, `marketplace_transactions`

### Inventory / supply
- `inventory_items`, `warehouses`, `suppliers`

### AI / knowledge / conversation
- `ai_sessions`, `ai_memories`, `ai_missions`, `ai_personas`, `ai_knowledge_documents`, `ai_knowledge_chunks`, `ai_tutor_sessions`
- `conversations`, `messages`, `knowledge_articles`, `knowledge_categories`, `knowledge_references`

### Education (Razvi Academy)
- `courses`, `course_modules`, `course_enrollments`, `lessons`, `lesson_progress`, `assignments`, `assignment_submissions`, `quizzes`, `quiz_questions`, `quiz_attempts`, `certificates`, `study_bookmarks`, `study_flashcards`, `study_notes`, `study_plans`, `study_sessions`

### Community / content
- `posts`, `comments`, `reactions`, `follows`, `groups`, `group_memberships`, `media_assets`, `content_uploads`

### Creator / studio
- `creator_assets`, `creator_brand_kits`, `creator_generations`, `creator_projects`, `creative_assets`, `creative_projects`

### Digital Human
- `dh_preferences`, `dh_presentations`, `dh_sessions`

### Ops / runtime / platform
- `job_queue`, `cron_runs`, `scheduled_jobs`, `workflows`, `workflow_runs`, `deployments`, `health_checks`, `incidents`, `incident_events`, `alert_rules`, `metrics_events`, `feature_flags`, `remote_config`, `settings`, `integrations`, `webhooks`, `webhook_deliveries`

### Hyperlocal OS
- `hl_businesses`, `hl_places`, `hl_events`, `hl_jobs`, `hl_reviews`, `hl_alerts`, `hl_user_location`

### i18n / geo
- `countries`, `languages`

### Preferences
- `user_preferences`

## Global rules

- Every table under `public` schema has explicit `GRANT` (never rely on defaults)
- RLS is enabled on every user-facing table; policies scope by `auth.uid()` or `has_role()`
- Roles read via `public.has_role(_user_id uuid, _role app_role)` security-definer function
- Ledger tables (`wallet_ledger_entries`, `credit_ledger_entries`, `subscription_events`) have triggers rejecting `UPDATE` / `DELETE`
- Balance views run with `security_invoker = on`

## Reserved / disallowed

Never touch schemas: `auth`, `storage`, `realtime`, `supabase_functions`, `vault`.
Never edit generated files: `src/integrations/supabase/{client.ts,client.server.ts,auth-middleware.ts,auth-attacher.ts,types.ts}`, `.env` VITE Supabase vars, `supabase/config.toml`.


-- CRM tasks
CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  kind text NOT NULL DEFAULT 'task' CHECK (kind IN ('task','call','meeting','email','followup')),
  due_at timestamptz,
  reminder_at timestamptz,
  completed_at timestamptz,
  recurrence text,
  assignee_id uuid,
  entity_type text CHECK (entity_type IN ('lead','customer','deal','company','contact')),
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_tasks_scope ON public.crm_tasks FOR ALL
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE INDEX crm_tasks_company_idx ON public.crm_tasks(company_id, status, due_at);
CREATE INDEX crm_tasks_assignee_idx ON public.crm_tasks(assignee_id, status);
CREATE INDEX crm_tasks_entity_idx ON public.crm_tasks(entity_type, entity_id);
SELECT public._hxp_attach_touch('public.crm_tasks');

-- CRM notes
CREATE TABLE public.crm_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('lead','customer','deal','company','contact')),
  entity_id uuid NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notes TO authenticated;
GRANT ALL ON public.crm_notes TO service_role;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_notes_scope ON public.crm_notes FOR ALL
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE INDEX crm_notes_entity_idx ON public.crm_notes(entity_type, entity_id, created_at DESC);
SELECT public._hxp_attach_touch('public.crm_notes');

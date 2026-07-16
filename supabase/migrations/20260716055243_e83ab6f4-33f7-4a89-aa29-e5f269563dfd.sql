CREATE TABLE IF NOT EXISTS public.faios_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text text NOT NULL,
  intent text,
  category text,
  status text NOT NULL DEFAULT 'received',
  mode text NOT NULL DEFAULT 'suggest',
  plan jsonb DEFAULT '{}'::jsonb,
  risk_level text DEFAULT 'low',
  impact jsonb DEFAULT '{}'::jsonb,
  requires_approval boolean NOT NULL DEFAULT true,
  approved_at timestamptz,
  approved_by uuid,
  executed_at timestamptz,
  result jsonb DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faios_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  weight int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (founder_id, scope, key)
);

CREATE TABLE IF NOT EXISTS public.faios_workspace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faios_terminal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command_id uuid REFERENCES public.faios_commands(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'system',
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faios_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id uuid NOT NULL REFERENCES public.faios_commands(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision text NOT NULL,
  note text,
  decided_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faios_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command_id uuid REFERENCES public.faios_commands(id) ON DELETE SET NULL,
  stage text NOT NULL,
  status text NOT NULL,
  detail jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.faios_commands TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faios_memory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faios_workspace_items TO authenticated;
GRANT SELECT, INSERT ON public.faios_terminal_lines TO authenticated;
GRANT SELECT, INSERT ON public.faios_approvals TO authenticated;
GRANT SELECT, INSERT ON public.faios_activity TO authenticated;
GRANT ALL ON public.faios_commands, public.faios_memory, public.faios_workspace_items,
              public.faios_terminal_lines, public.faios_approvals, public.faios_activity
              TO service_role;

ALTER TABLE public.faios_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faios_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faios_workspace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faios_terminal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faios_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faios_activity ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'faios_commands','faios_memory','faios_workspace_items',
    'faios_terminal_lines','faios_approvals','faios_activity'
  ] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (founder_id = auth.uid() OR public.has_role(auth.uid(), ''admin''))',
      t || '_sel', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (founder_id = auth.uid() OR public.has_role(auth.uid(), ''admin''))',
      t || '_ins', t);
  END LOOP;
END $$;

CREATE POLICY faios_commands_upd ON public.faios_commands FOR UPDATE TO authenticated
  USING (founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY faios_memory_upd ON public.faios_memory FOR UPDATE TO authenticated
  USING (founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY faios_memory_del ON public.faios_memory FOR DELETE TO authenticated
  USING (founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY faios_workspace_upd ON public.faios_workspace_items FOR UPDATE TO authenticated
  USING (founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY faios_workspace_del ON public.faios_workspace_items FOR DELETE TO authenticated
  USING (founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS faios_commands_founder_created_idx ON public.faios_commands (founder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS faios_memory_founder_scope_idx ON public.faios_memory (founder_id, scope);
CREATE INDEX IF NOT EXISTS faios_workspace_founder_kind_idx ON public.faios_workspace_items (founder_id, kind, updated_at DESC);
CREATE INDEX IF NOT EXISTS faios_terminal_founder_created_idx ON public.faios_terminal_lines (founder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS faios_activity_founder_created_idx ON public.faios_activity (founder_id, created_at DESC);
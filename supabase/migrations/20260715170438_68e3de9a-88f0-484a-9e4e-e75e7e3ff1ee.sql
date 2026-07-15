
-- R45 Founder Executive AI
CREATE TABLE public.founder_business_health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  computed_by uuid NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  dimension text NOT NULL,
  score numeric NOT NULL,
  status text NOT NULL,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_runtimes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fbhs_company ON public.founder_business_health_snapshots(company_id, dimension, created_at DESC);
GRANT SELECT, INSERT ON public.founder_business_health_snapshots TO authenticated;
GRANT ALL ON public.founder_business_health_snapshots TO service_role;
ALTER TABLE public.founder_business_health_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY fbhs_read ON public.founder_business_health_snapshots FOR SELECT TO authenticated
  USING ((company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)) OR public.is_ops_admin(auth.uid()));
CREATE POLICY fbhs_write ON public.founder_business_health_snapshots FOR INSERT TO authenticated
  WITH CHECK (computed_by = auth.uid() AND
    ((company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)) OR public.is_ops_admin(auth.uid())));
CREATE TRIGGER trg_fbhs_immutable BEFORE UPDATE OR DELETE ON public.founder_business_health_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.specialist_turns_immutable();

CREATE TABLE public.founder_decision_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  decided_by uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  decision text NOT NULL,
  rationale text,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations_considered jsonb NOT NULL DEFAULT '[]'::jsonb,
  alternatives jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric NOT NULL DEFAULT 0,
  outcome text,
  outcome_recorded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fdr_company ON public.founder_decision_records(company_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.founder_decision_records TO authenticated;
GRANT ALL ON public.founder_decision_records TO service_role;
ALTER TABLE public.founder_decision_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY fdr_read ON public.founder_decision_records FOR SELECT TO authenticated
  USING (decided_by = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)) OR public.is_ops_admin(auth.uid()));
CREATE POLICY fdr_write ON public.founder_decision_records FOR INSERT TO authenticated
  WITH CHECK (decided_by = auth.uid());
CREATE POLICY fdr_update_outcome ON public.founder_decision_records FOR UPDATE TO authenticated
  USING (decided_by = auth.uid()) WITH CHECK (decided_by = auth.uid());

CREATE TABLE public.founder_executive_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  generated_by uuid NOT NULL,
  report_type text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  facts_count integer NOT NULL DEFAULT 0,
  recommendations_count integer NOT NULL DEFAULT 0,
  source_runtimes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fer_company ON public.founder_executive_reports(company_id, report_type, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.founder_executive_reports TO authenticated;
GRANT ALL ON public.founder_executive_reports TO service_role;
ALTER TABLE public.founder_executive_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY fer_read ON public.founder_executive_reports FOR SELECT TO authenticated
  USING (generated_by = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)) OR public.is_ops_admin(auth.uid()));
CREATE POLICY fer_write ON public.founder_executive_reports FOR INSERT TO authenticated
  WITH CHECK (generated_by = auth.uid());
CREATE POLICY fer_update ON public.founder_executive_reports FOR UPDATE TO authenticated
  USING (generated_by = auth.uid()) WITH CHECK (generated_by = auth.uid());
CREATE TRIGGER trg_touch_fer BEFORE UPDATE ON public.founder_executive_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- R46 Receptionist
CREATE TABLE public.receptionist_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key text NOT NULL,
  user_id uuid,
  company_id uuid,
  channel text NOT NULL DEFAULT 'web',
  mode text NOT NULL DEFAULT 'welcome',
  language text NOT NULL DEFAULT 'en',
  is_returning boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rec_sessions_visitor ON public.receptionist_sessions(visitor_key, started_at DESC);
CREATE INDEX idx_rec_sessions_company ON public.receptionist_sessions(company_id);
GRANT SELECT, INSERT, UPDATE ON public.receptionist_sessions TO authenticated;
GRANT ALL ON public.receptionist_sessions TO service_role;
ALTER TABLE public.receptionist_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rec_sessions_read ON public.receptionist_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid()
      OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
      OR public.is_ops_admin(auth.uid()));
CREATE POLICY rec_sessions_write ON public.receptionist_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY rec_sessions_update ON public.receptionist_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (user_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE TRIGGER trg_touch_rec_sessions BEFORE UPDATE ON public.receptionist_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.receptionist_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.receptionist_sessions(id) ON DELETE CASCADE,
  seq bigint NOT NULL,
  user_id uuid,
  company_id uuid,
  mode text NOT NULL,
  intent text NOT NULL,
  domain text NOT NULL,
  routed_runtime text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric NOT NULL DEFAULT 0,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, seq)
);
CREATE INDEX idx_rec_turns_session ON public.receptionist_turns(session_id, seq);
GRANT SELECT, INSERT ON public.receptionist_turns TO authenticated;
GRANT ALL ON public.receptionist_turns TO service_role;
ALTER TABLE public.receptionist_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY rec_turns_read ON public.receptionist_turns FOR SELECT TO authenticated
  USING (user_id = auth.uid()
      OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
      OR public.is_ops_admin(auth.uid()));
CREATE POLICY rec_turns_write ON public.receptionist_turns FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.receptionist_sessions s WHERE s.id = session_id
            AND (s.user_id = auth.uid() OR (s.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), s.company_id))))
  );
CREATE TRIGGER trg_rec_turns_immutable BEFORE UPDATE OR DELETE ON public.receptionist_turns
  FOR EACH ROW EXECUTE FUNCTION public.specialist_turns_immutable();

CREATE TABLE public.receptionist_analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  total_sessions integer NOT NULL DEFAULT 0,
  total_turns integer NOT NULL DEFAULT 0,
  languages jsonb NOT NULL DEFAULT '{}'::jsonb,
  mode_distribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  domain_distribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  lead_conversions integer NOT NULL DEFAULT 0,
  appointment_conversions integer NOT NULL DEFAULT 0,
  ticket_conversions integer NOT NULL DEFAULT 0,
  avg_confidence numeric NOT NULL DEFAULT 0,
  avg_latency_ms numeric NOT NULL DEFAULT 0,
  computed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rec_analytics_company ON public.receptionist_analytics_snapshots(company_id, created_at DESC);
GRANT SELECT, INSERT ON public.receptionist_analytics_snapshots TO authenticated;
GRANT ALL ON public.receptionist_analytics_snapshots TO service_role;
ALTER TABLE public.receptionist_analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY rec_analytics_read ON public.receptionist_analytics_snapshots FOR SELECT TO authenticated
  USING ((company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)) OR public.is_ops_admin(auth.uid()));
CREATE POLICY rec_analytics_write ON public.receptionist_analytics_snapshots FOR INSERT TO authenticated
  WITH CHECK (computed_by = auth.uid() AND
    ((company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)) OR public.is_ops_admin(auth.uid())));
CREATE TRIGGER trg_rec_analytics_immutable BEFORE UPDATE OR DELETE ON public.receptionist_analytics_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.specialist_turns_immutable();

-- R47 Meeting Runtime — create tables first, then cross-referencing policies
CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  workspace_id uuid,
  host_id uuid NOT NULL,
  meeting_type text NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  location text,
  join_url text,
  linked_presentation_session_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_meetings_host ON public.meetings(host_id, scheduled_start DESC);
CREATE INDEX idx_meetings_company ON public.meetings(company_id, scheduled_start DESC);
GRANT SELECT, INSERT, UPDATE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_touch_meetings BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id uuid,
  external_email text,
  display_name text,
  role text NOT NULL DEFAULT 'participant',
  attendance_status text NOT NULL DEFAULT 'invited',
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mp_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX idx_mp_user ON public.meeting_participants(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_participants TO authenticated;
GRANT ALL ON public.meeting_participants TO service_role;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_touch_mp BEFORE UPDATE ON public.meeting_participants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Now the cross-referencing policies
CREATE POLICY meetings_read ON public.meetings FOR SELECT TO authenticated
  USING (host_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = meetings.id AND mp.user_id = auth.uid())
      OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
      OR public.is_ops_admin(auth.uid()));
CREATE POLICY meetings_write ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());
CREATE POLICY meetings_update ON public.meetings FOR UPDATE TO authenticated
  USING (host_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (host_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));

CREATE POLICY mp_read ON public.meeting_participants FOR SELECT TO authenticated
  USING (user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_participants.meeting_id
                  AND (m.host_id = auth.uid()
                       OR (m.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), m.company_id)))));
CREATE POLICY mp_write ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_participants.meeting_id AND m.host_id = auth.uid()));
CREATE POLICY mp_update ON public.meeting_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_participants.meeting_id AND m.host_id = auth.uid()))
  WITH CHECK (user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_participants.meeting_id AND m.host_id = auth.uid()));
CREATE POLICY mp_delete ON public.meeting_participants FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_participants.meeting_id AND m.host_id = auth.uid()));

CREATE TABLE public.meeting_agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  seq integer NOT NULL,
  title text NOT NULL,
  description text,
  owner_user_id uuid,
  duration_minutes integer,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, seq)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_agenda_items TO authenticated;
GRANT ALL ON public.meeting_agenda_items TO service_role;
ALTER TABLE public.meeting_agenda_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY ma_read ON public.meeting_agenda_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_agenda_items.meeting_id
        AND (m.host_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = auth.uid())
          OR (m.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), m.company_id)))));
CREATE POLICY ma_write ON public.meeting_agenda_items FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_agenda_items.meeting_id AND m.host_id = auth.uid()));
CREATE POLICY ma_update ON public.meeting_agenda_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_agenda_items.meeting_id AND m.host_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_agenda_items.meeting_id AND m.host_id = auth.uid()));
CREATE POLICY ma_delete ON public.meeting_agenda_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_agenda_items.meeting_id AND m.host_id = auth.uid()));
CREATE TRIGGER trg_touch_ma BEFORE UPDATE ON public.meeting_agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.meeting_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  version integer NOT NULL,
  authored_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  summary text,
  content jsonb NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, version)
);
GRANT SELECT, INSERT, UPDATE ON public.meeting_minutes TO authenticated;
GRANT ALL ON public.meeting_minutes TO service_role;
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY mm_read ON public.meeting_minutes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_minutes.meeting_id
        AND (m.host_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = auth.uid())
          OR (m.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), m.company_id)))));
CREATE POLICY mm_write ON public.meeting_minutes FOR INSERT TO authenticated
  WITH CHECK (authored_by = auth.uid() AND EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_minutes.meeting_id
        AND (m.host_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = auth.uid()))));
CREATE POLICY mm_update ON public.meeting_minutes FOR UPDATE TO authenticated
  USING (authored_by = auth.uid() OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_minutes.meeting_id AND m.host_id = auth.uid()))
  WITH CHECK (authored_by = auth.uid() OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_minutes.meeting_id AND m.host_id = auth.uid()));

CREATE TABLE public.meeting_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  agenda_item_id uuid REFERENCES public.meeting_agenda_items(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  assignee_id uuid,
  assignee_email text,
  due_at timestamptz,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL,
  completed_at timestamptz,
  linked_task_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mai_meeting ON public.meeting_action_items(meeting_id);
CREATE INDEX idx_mai_assignee ON public.meeting_action_items(assignee_id, status);
GRANT SELECT, INSERT, UPDATE ON public.meeting_action_items TO authenticated;
GRANT ALL ON public.meeting_action_items TO service_role;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY mai_read ON public.meeting_action_items FOR SELECT TO authenticated
  USING (assignee_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_action_items.meeting_id
        AND (m.host_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = auth.uid())
          OR (m.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), m.company_id)))));
CREATE POLICY mai_write ON public.meeting_action_items FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_action_items.meeting_id
        AND (m.host_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = auth.uid()))));
CREATE POLICY mai_update ON public.meeting_action_items FOR UPDATE TO authenticated
  USING (assignee_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_action_items.meeting_id AND m.host_id = auth.uid()))
  WITH CHECK (assignee_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_action_items.meeting_id AND m.host_id = auth.uid()));
CREATE TRIGGER trg_touch_mai BEFORE UPDATE ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.meeting_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  agenda_item_id uuid REFERENCES public.meeting_agenda_items(id) ON DELETE SET NULL,
  decided_by uuid NOT NULL,
  decision text NOT NULL,
  title text NOT NULL,
  rationale text,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.meeting_decisions TO authenticated;
GRANT ALL ON public.meeting_decisions TO service_role;
ALTER TABLE public.meeting_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY md_read ON public.meeting_decisions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_decisions.meeting_id
        AND (m.host_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = auth.uid())
          OR (m.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), m.company_id)))));
CREATE POLICY md_write ON public.meeting_decisions FOR INSERT TO authenticated
  WITH CHECK (decided_by = auth.uid() AND EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_decisions.meeting_id
        AND (m.host_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = auth.uid()))));
CREATE TRIGGER trg_md_immutable BEFORE UPDATE OR DELETE ON public.meeting_decisions
  FOR EACH ROW EXECUTE FUNCTION public.specialist_turns_immutable();

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          occurred_at: string
          source: string
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          source?: string
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          source?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          channel: string
          company_id: string
          content: string
          created_at: string
          from_agent_id: string | null
          id: string
          metadata: Json
          role: string
          task_id: string | null
          to_agent_id: string | null
          to_user_id: string | null
        }
        Insert: {
          channel: string
          company_id: string
          content: string
          created_at?: string
          from_agent_id?: string | null
          id?: string
          metadata?: Json
          role?: string
          task_id?: string | null
          to_agent_id?: string | null
          to_user_id?: string | null
        }
        Update: {
          channel?: string
          company_id?: string
          content?: string
          created_at?: string
          from_agent_id?: string | null
          id?: string
          metadata?: Json
          role?: string
          task_id?: string | null
          to_agent_id?: string | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_messages_from_agent_id_fkey"
            columns: ["from_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_messages_to_agent_id_fkey"
            columns: ["to_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_metrics_daily: {
        Row: {
          agent_id: string
          avg_duration_ms: number
          company_id: string
          created_at: string
          day: string
          id: string
          tasks_escalated: number
          tasks_failed: number
          tasks_succeeded: number
          tasks_total: number
          tool_calls: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          avg_duration_ms?: number
          company_id: string
          created_at?: string
          day: string
          id?: string
          tasks_escalated?: number
          tasks_failed?: number
          tasks_succeeded?: number
          tasks_total?: number
          tool_calls?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          avg_duration_ms?: number
          company_id?: string
          created_at?: string
          day?: string
          id?: string
          tasks_escalated?: number
          tasks_failed?: number
          tasks_succeeded?: number
          tasks_total?: number
          tool_calls?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_metrics_daily_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_metrics_daily_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_registry: {
        Row: {
          active: boolean
          allowed_actions: string[]
          allowed_runtimes: string[]
          capabilities: string[]
          code: string
          company_id: string | null
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          kind: string
          max_concurrent: number
          max_iterations: number
          model: string
          name: string
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          allowed_actions?: string[]
          allowed_runtimes?: string[]
          capabilities?: string[]
          code: string
          company_id?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: string
          max_concurrent?: number
          max_iterations?: number
          model?: string
          name: string
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          allowed_actions?: string[]
          allowed_runtimes?: string[]
          capabilities?: string[]
          code?: string
          company_id?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: string
          max_concurrent?: number
          max_iterations?: number
          model?: string
          name?: string
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_registry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: string
          brain_session_id: string | null
          company_id: string
          completed_at: string | null
          context: Json
          created_at: string
          deadline_at: string | null
          duration_ms: number | null
          error: string | null
          escalated_to: string | null
          escalation_reason: string | null
          goal: string
          id: string
          input: Json
          iterations: number
          parent_task_id: string | null
          priority: number
          requested_by: string | null
          result: Json
          started_at: string | null
          status: string
          task_type: string
          updated_at: string
          workflow_run_id: string | null
        }
        Insert: {
          agent_id: string
          brain_session_id?: string | null
          company_id: string
          completed_at?: string | null
          context?: Json
          created_at?: string
          deadline_at?: string | null
          duration_ms?: number | null
          error?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          goal: string
          id?: string
          input?: Json
          iterations?: number
          parent_task_id?: string | null
          priority?: number
          requested_by?: string | null
          result?: Json
          started_at?: string | null
          status?: string
          task_type: string
          updated_at?: string
          workflow_run_id?: string | null
        }
        Update: {
          agent_id?: string
          brain_session_id?: string | null
          company_id?: string
          completed_at?: string | null
          context?: Json
          created_at?: string
          deadline_at?: string | null
          duration_ms?: number | null
          error?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          goal?: string
          id?: string
          input?: Json
          iterations?: number
          parent_task_id?: string | null
          priority?: number
          requested_by?: string | null
          result?: Json
          started_at?: string | null
          status?: string
          task_type?: string
          updated_at?: string
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_brain_session_id_fkey"
            columns: ["brain_session_id"]
            isOneToOne: false
            referencedRelation: "brain_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "auto_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tool_calls: {
        Row: {
          action: string
          agent_id: string | null
          ai_recommendation: string | null
          arguments: Json
          company_id: string
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          result_facts: Json
          runtime: string
          status: string
          task_id: string | null
        }
        Insert: {
          action: string
          agent_id?: string | null
          ai_recommendation?: string | null
          arguments?: Json
          company_id: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          result_facts?: Json
          runtime: string
          status: string
          task_id?: string | null
        }
        Update: {
          action?: string
          agent_id?: string | null
          ai_recommendation?: string | null
          arguments?: Json
          company_id?: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          result_facts?: Json
          runtime?: string
          status?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tool_calls_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tool_calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tool_calls_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_chunks: {
        Row: {
          chunk_index: number
          company_id: string | null
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          company_id?: string | null
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          company_id?: string | null
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_chunks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ai_knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_documents: {
        Row: {
          company_id: string | null
          content_hash: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          language: string | null
          metadata: Json
          mime_type: string | null
          size_bytes: number | null
          source_url: string | null
          status: Database["public"]["Enums"]["record_status"]
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
          workspace_id: string | null
        }
        Insert: {
          company_id?: string | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          mime_type?: string | null
          size_bytes?: number | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tags?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string | null
        }
        Update: {
          company_id?: string | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          mime_type?: string | null
          size_bytes?: number | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memories: {
        Row: {
          company_id: string | null
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          embedding: string | null
          expires_at: string | null
          id: string
          importance: number
          key: string
          metadata: Json
          scope: string
          updated_at: string
          updated_by: string | null
          user_id: string
          version: number
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          importance?: number
          key: string
          metadata?: Json
          scope?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
          version?: number
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          importance?: number
          key?: string
          metadata?: Json
          scope?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_memories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_missions: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          objective: string
          plan: Json
          progress: number
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
          version: number
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          objective: string
          plan?: Json
          progress?: number
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          version?: number
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          objective?: string
          plan?: Json
          progress?: number
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_missions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_personas: {
        Row: {
          avatar_url: string | null
          code: string
          company_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_public: boolean
          model: string
          name: string
          status: Database["public"]["Enums"]["record_status"]
          system_prompt: string
          temperature: number
          updated_at: string
          updated_by: string | null
          version: number
          voice_profile: Json
        }
        Insert: {
          avatar_url?: string | null
          code: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          model?: string
          name: string
          status?: Database["public"]["Enums"]["record_status"]
          system_prompt: string
          temperature?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          voice_profile?: Json
        }
        Update: {
          avatar_url?: string | null
          code?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          model?: string
          name?: string
          status?: Database["public"]["Enums"]["record_status"]
          system_prompt?: string
          temperature?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          voice_profile?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_personas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sessions: {
        Row: {
          channel: string
          company_id: string | null
          conversation_id: string | null
          cost_cents: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          ended_at: string | null
          id: string
          input_tokens: number
          metadata: Json
          output_tokens: number
          persona_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["ai_session_status"]
          updated_at: string
          updated_by: string | null
          user_id: string
          version: number
          workspace_id: string | null
        }
        Insert: {
          channel?: string
          company_id?: string | null
          conversation_id?: string | null
          cost_cents?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          ended_at?: string | null
          id?: string
          input_tokens?: number
          metadata?: Json
          output_tokens?: number
          persona_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["ai_session_status"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
          version?: number
          workspace_id?: string | null
        }
        Update: {
          channel?: string
          company_id?: string | null
          conversation_id?: string | null
          cost_cents?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          ended_at?: string | null
          id?: string
          input_tokens?: number
          metadata?: Json
          output_tokens?: number
          persona_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["ai_session_status"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          version?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sessions_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "ai_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tutor_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          mode: string
          topic: string | null
          transcript: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          mode?: string
          topic?: string | null
          transcript?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          mode?: string
          topic?: string | null
          transcript?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tutor_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          channels: Json
          condition: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          service: string
          severity: Database["public"]["Enums"]["alert_severity"]
          updated_at: string
        }
        Insert: {
          channels?: Json
          condition?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          service: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          updated_at?: string
        }
        Update: {
          channels?: Json
          condition?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          service?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          hashed_key: string
          id: string
          last_used_at: string | null
          name: string
          prefix: string
          revoked_at: string | null
          scopes: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          hashed_key: string
          id?: string
          last_used_at?: string | null
          name: string
          prefix: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          hashed_key?: string
          id?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_api_registry: {
        Row: {
          auth_methods: string[]
          base_path: string
          company_id: string | null
          created_at: string
          created_by: string | null
          default_rate_limit_per_min: number
          deprecated_at: string | null
          description: string | null
          id: string
          kind: string
          metadata: Json
          name: string
          requires_auth: boolean
          scopes: string[]
          slug: string
          status: string
          successor_id: string | null
          tags: string[]
          updated_at: string
          version: string
        }
        Insert: {
          auth_methods?: string[]
          base_path: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          default_rate_limit_per_min?: number
          deprecated_at?: string | null
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name: string
          requires_auth?: boolean
          scopes?: string[]
          slug: string
          status?: string
          successor_id?: string | null
          tags?: string[]
          updated_at?: string
          version?: string
        }
        Update: {
          auth_methods?: string[]
          base_path?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          default_rate_limit_per_min?: number
          deprecated_at?: string | null
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name?: string
          requires_auth?: boolean
          scopes?: string[]
          slug?: string
          status?: string
          successor_id?: string | null
          tags?: string[]
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "apigw_api_registry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apigw_api_registry_successor_id_fkey"
            columns: ["successor_id"]
            isOneToOne: false
            referencedRelation: "apigw_api_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_api_routes: {
        Row: {
          active: boolean
          api_id: string
          cacheable: boolean
          created_at: string
          deprecated: boolean
          description: string | null
          example_request: Json
          example_response: Json
          id: string
          method: string
          path: string
          rate_limit_per_min: number | null
          request_schema: Json
          required_scopes: string[]
          response_schema: Json
          runtime: string | null
          runtime_action: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          api_id: string
          cacheable?: boolean
          created_at?: string
          deprecated?: boolean
          description?: string | null
          example_request?: Json
          example_response?: Json
          id?: string
          method: string
          path: string
          rate_limit_per_min?: number | null
          request_schema?: Json
          required_scopes?: string[]
          response_schema?: Json
          runtime?: string | null
          runtime_action?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          api_id?: string
          cacheable?: boolean
          created_at?: string
          deprecated?: boolean
          description?: string | null
          example_request?: Json
          example_response?: Json
          id?: string
          method?: string
          path?: string
          rate_limit_per_min?: number | null
          request_schema?: Json
          required_scopes?: string[]
          response_schema?: Json
          runtime?: string | null
          runtime_action?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apigw_api_routes_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "apigw_api_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_connections: {
        Row: {
          company_id: string
          config: Json
          connector_id: string
          created_at: string
          created_by: string | null
          credentials_ref: string | null
          enabled: boolean
          failure_streak: number
          id: string
          last_health_at: string | null
          last_health_message: string | null
          last_used_at: string | null
          name: string
          scopes: string[]
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          config?: Json
          connector_id: string
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          enabled?: boolean
          failure_streak?: number
          id?: string
          last_health_at?: string | null
          last_health_message?: string | null
          last_used_at?: string | null
          name: string
          scopes?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json
          connector_id?: string
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          enabled?: boolean
          failure_streak?: number
          id?: string
          last_health_at?: string | null
          last_health_message?: string | null
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apigw_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apigw_connections_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "apigw_connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_connectors: {
        Row: {
          auth_kind: string
          category: string
          code: string
          config_schema: Json
          created_at: string
          description: string | null
          documentation_url: string | null
          icon_url: string | null
          id: string
          name: string
          scopes: string[]
          status: string
          updated_at: string
          webhook_events: string[]
        }
        Insert: {
          auth_kind: string
          category: string
          code: string
          config_schema?: Json
          created_at?: string
          description?: string | null
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          name: string
          scopes?: string[]
          status?: string
          updated_at?: string
          webhook_events?: string[]
        }
        Update: {
          auth_kind?: string
          category?: string
          code?: string
          config_schema?: Json
          created_at?: string
          description?: string | null
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          scopes?: string[]
          status?: string
          updated_at?: string
          webhook_events?: string[]
        }
        Relationships: []
      }
      apigw_keys: {
        Row: {
          allowed_apis: string[]
          company_id: string
          created_at: string
          environment: string
          expires_at: string | null
          id: string
          key_hash: string
          key_last4: string
          key_prefix: string
          last_used_at: string | null
          metadata: Json
          name: string
          owner_user_id: string | null
          rate_limit_per_min: number
          revoked_at: string | null
          revoked_reason: string | null
          rotated_from: string | null
          scopes: string[]
          updated_at: string
        }
        Insert: {
          allowed_apis?: string[]
          company_id: string
          created_at?: string
          environment?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_last4: string
          key_prefix: string
          last_used_at?: string | null
          metadata?: Json
          name: string
          owner_user_id?: string | null
          rate_limit_per_min?: number
          revoked_at?: string | null
          revoked_reason?: string | null
          rotated_from?: string | null
          scopes?: string[]
          updated_at?: string
        }
        Update: {
          allowed_apis?: string[]
          company_id?: string
          created_at?: string
          environment?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_last4?: string
          key_prefix?: string
          last_used_at?: string | null
          metadata?: Json
          name?: string
          owner_user_id?: string | null
          rate_limit_per_min?: number
          revoked_at?: string | null
          revoked_reason?: string | null
          rotated_from?: string | null
          scopes?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apigw_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apigw_keys_rotated_from_fkey"
            columns: ["rotated_from"]
            isOneToOne: false
            referencedRelation: "apigw_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_oauth_clients: {
        Row: {
          active: boolean
          allowed_scopes: string[]
          client_id: string
          client_secret_hash: string
          company_id: string
          created_at: string
          created_by: string | null
          grant_types: string[]
          id: string
          name: string
          redirect_uris: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          allowed_scopes?: string[]
          client_id: string
          client_secret_hash: string
          company_id: string
          created_at?: string
          created_by?: string | null
          grant_types?: string[]
          id?: string
          name: string
          redirect_uris?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          allowed_scopes?: string[]
          client_id?: string
          client_secret_hash?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          grant_types?: string[]
          id?: string
          name?: string
          redirect_uris?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apigw_oauth_clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_oauth_tokens: {
        Row: {
          access_token_hash: string
          client_id: string
          company_id: string
          created_at: string
          expires_at: string
          id: string
          refresh_token_hash: string | null
          revoked_at: string | null
          scopes: string[]
          user_id: string | null
        }
        Insert: {
          access_token_hash: string
          client_id: string
          company_id: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token_hash?: string | null
          revoked_at?: string | null
          scopes?: string[]
          user_id?: string | null
        }
        Update: {
          access_token_hash?: string
          client_id?: string
          company_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token_hash?: string | null
          revoked_at?: string | null
          scopes?: string[]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apigw_oauth_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "apigw_oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apigw_oauth_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_rate_counters: {
        Row: {
          count: number
          id: string
          limit_per_min: number
          scope_key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          id?: string
          limit_per_min: number
          scope_key: string
          updated_at?: string
          window_start: string
        }
        Update: {
          count?: number
          id?: string
          limit_per_min?: number
          scope_key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      apigw_service_accounts: {
        Row: {
          active: boolean
          api_key_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          scopes: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          api_key_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          scopes?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          api_key_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          scopes?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apigw_service_accounts_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "apigw_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apigw_service_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_usage_log: {
        Row: {
          api_id: string | null
          api_key_id: string | null
          auth_method: string | null
          company_id: string | null
          created_at: string
          error_code: string | null
          id: string
          ip: unknown
          latency_ms: number
          metadata: Json
          method: string
          path: string
          request_bytes: number
          response_bytes: number
          route_id: string | null
          status_code: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          api_id?: string | null
          api_key_id?: string | null
          auth_method?: string | null
          company_id?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          ip?: unknown
          latency_ms?: number
          metadata?: Json
          method: string
          path: string
          request_bytes?: number
          response_bytes?: number
          route_id?: string | null
          status_code: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          api_id?: string | null
          api_key_id?: string | null
          auth_method?: string | null
          company_id?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          ip?: unknown
          latency_ms?: number
          metadata?: Json
          method?: string
          path?: string
          request_bytes?: number
          response_bytes?: number
          route_id?: string | null
          status_code?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apigw_usage_log_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "apigw_api_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apigw_usage_log_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "apigw_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apigw_usage_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apigw_usage_log_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "apigw_api_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_webhook_deliveries: {
        Row: {
          attempt: number
          company_id: string
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          event_id: string
          event_type: string
          id: string
          last_error: string | null
          last_response: string | null
          last_status_code: number | null
          max_attempts: number
          next_attempt_at: string
          payload: Json
          signature: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt?: number
          company_id: string
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          event_id: string
          event_type: string
          id?: string
          last_error?: string | null
          last_response?: string | null
          last_status_code?: number | null
          max_attempts?: number
          next_attempt_at?: string
          payload: Json
          signature: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt?: number
          company_id?: string
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          event_id?: string
          event_type?: string
          id?: string
          last_error?: string | null
          last_response?: string | null
          last_status_code?: number | null
          max_attempts?: number
          next_attempt_at?: string
          payload?: Json
          signature?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apigw_webhook_deliveries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apigw_webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "apigw_webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_webhook_endpoints: {
        Row: {
          active: boolean
          backoff: string
          company_id: string
          created_at: string
          created_by: string | null
          disabled_reason: string | null
          event_types: string[]
          failure_streak: number
          id: string
          last_failure_at: string | null
          last_success_at: string | null
          max_retries: number
          metadata: Json
          name: string
          secret_hash: string
          secret_last4: string
          timeout_ms: number
          updated_at: string
          url: string
          version: string
        }
        Insert: {
          active?: boolean
          backoff?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          disabled_reason?: string | null
          event_types?: string[]
          failure_streak?: number
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          max_retries?: number
          metadata?: Json
          name: string
          secret_hash: string
          secret_last4: string
          timeout_ms?: number
          updated_at?: string
          url: string
          version?: string
        }
        Update: {
          active?: boolean
          backoff?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          disabled_reason?: string | null
          event_types?: string[]
          failure_streak?: number
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          max_retries?: number
          metadata?: Json
          name?: string
          secret_hash?: string
          secret_last4?: string
          timeout_ms?: number
          updated_at?: string
          url?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "apigw_webhook_endpoints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      apigw_webhook_inbound: {
        Row: {
          company_id: string | null
          created_at: string
          error: string | null
          event_id: string
          event_type: string | null
          headers: Json
          id: string
          payload: Json
          processed_at: string | null
          signature: string | null
          source: string
          status: string
          verified: boolean
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          error?: string | null
          event_id: string
          event_type?: string | null
          headers?: Json
          id?: string
          payload: Json
          processed_at?: string | null
          signature?: string | null
          source: string
          status?: string
          verified?: boolean
        }
        Update: {
          company_id?: string | null
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string | null
          headers?: Json
          id?: string
          payload?: Json
          processed_at?: string | null
          signature?: string | null
          source?: string
          status?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "apigw_webhook_inbound_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_delegations: {
        Row: {
          company_id: string
          created_at: string
          delegatee_id: string
          delegator_id: string
          ends_at: string | null
          entity_type: string | null
          id: string
          reason: string | null
          starts_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          delegatee_id: string
          delegator_id: string
          ends_at?: string | null
          entity_type?: string | null
          id?: string
          reason?: string | null
          starts_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          delegatee_id?: string
          delegator_id?: string
          ends_at?: string | null
          entity_type?: string | null
          id?: string
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_delegations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          amount_cents: number | null
          approver_id: string | null
          company_id: string
          created_at: string
          currency: string | null
          decided_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          reason: string | null
          requested_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          approver_id?: string | null
          company_id: string
          created_at?: string
          currency?: string | null
          decided_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          reason?: string | null
          requested_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          approver_id?: string | null
          company_id?: string
          created_at?: string
          currency?: string | null
          decided_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          reason?: string | null
          requested_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attachments: Json
          content: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          feedback: string | null
          graded_at: string | null
          id: string
          score: number | null
          submitted_at: string
          updated_at: string
          updated_by: string | null
          user_id: string
          version: number
        }
        Insert: {
          assignment_id: string
          attachments?: Json
          content?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          submitted_at?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
          version?: number
        }
        Update: {
          assignment_id?: string
          attachments?: Json
          content?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          submitted_at?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          company_id: string | null
          course_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          due_at: string | null
          id: string
          instructions: string | null
          max_score: number
          status: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          company_id?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          instructions?: string | null
          max_score?: number
          status?: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          company_id?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          instructions?: string | null
          max_score?: number
          status?: Database["public"]["Enums"]["record_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          category: string
          company_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          metadata: Json
          occurred_at: string
          severity: Database["public"]["Enums"]["audit_severity"]
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          category: string
          company_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          occurred_at?: string
          severity?: Database["public"]["Enums"]["audit_severity"]
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          category?: string
          company_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          occurred_at?: string
          severity?: Database["public"]["Enums"]["audit_severity"]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_approvals: {
        Row: {
          approver_role: string
          company_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          expires_at: string | null
          id: string
          reason: string | null
          requested_by: string | null
          run_id: string
          status: string
          step_index: number | null
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          approver_role: string
          company_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          requested_by?: string | null
          run_id: string
          status?: string
          step_index?: number | null
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          approver_role?: string
          company_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          requested_by?: string | null
          run_id?: string
          status?: string
          step_index?: number | null
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_approvals_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "auto_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_approvals_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "auto_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_queue: {
        Row: {
          attempts: number
          company_id: string
          created_at: string
          id: string
          kind: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          priority: number
          run_id: string | null
          scheduled_for: string
          status: string
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          attempts?: number
          company_id: string
          created_at?: string
          id?: string
          kind: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          run_id?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          attempts?: number
          company_id?: string
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          run_id?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_queue_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "auto_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_queue_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "auto_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_runs: {
        Row: {
          attempt: number
          company_id: string
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          result: Json
          started_at: string | null
          status: string
          trigger_kind: string
          trigger_payload: Json
          triggered_by: string | null
          workflow_id: string
        }
        Insert: {
          attempt?: number
          company_id: string
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          result?: Json
          started_at?: string | null
          status?: string
          trigger_kind: string
          trigger_payload?: Json
          triggered_by?: string | null
          workflow_id: string
        }
        Update: {
          attempt?: number
          company_id?: string
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          result?: Json
          started_at?: string | null
          status?: string
          trigger_kind?: string
          trigger_payload?: Json
          triggered_by?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "auto_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_step_runs: {
        Row: {
          action: string | null
          company_id: string
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input: Json
          kind: string
          output: Json
          run_id: string
          runtime: string | null
          status: string
          step_id: string | null
          step_index: number
        }
        Insert: {
          action?: string | null
          company_id: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json
          kind: string
          output?: Json
          run_id: string
          runtime?: string | null
          status: string
          step_id?: string | null
          step_index: number
        }
        Update: {
          action?: string | null
          company_id?: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json
          kind?: string
          output?: Json
          run_id?: string
          runtime?: string | null
          status?: string
          step_id?: string | null
          step_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "auto_step_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_step_runs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "auto_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_workflows: {
        Row: {
          active: boolean
          approval_role: string | null
          company_id: string
          conditions: Json
          created_at: string
          created_by: string | null
          cron_expr: string | null
          description: string | null
          id: string
          name: string
          requires_approval: boolean
          retry_policy: Json
          steps: Json
          tags: string[]
          timezone: string
          trigger_config: Json
          trigger_kind: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          approval_role?: string | null
          company_id: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          cron_expr?: string | null
          description?: string | null
          id?: string
          name: string
          requires_approval?: boolean
          retry_policy?: Json
          steps?: Json
          tags?: string[]
          timezone?: string
          trigger_config?: Json
          trigger_kind: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          approval_role?: string | null
          company_id?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          cron_expr?: string | null
          description?: string | null
          id?: string
          name?: string
          requires_approval?: boolean
          retry_policy?: Json
          steps?: Json
          tags?: string[]
          timezone?: string
          trigger_config?: Json
          trigger_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_id: string | null
          account_number: string | null
          bank_name: string | null
          company_id: string
          created_at: string
          currency: string
          current_balance_cents: number
          id: string
          ifsc: string | null
          is_active: boolean
          metadata: Json
          name: string
          opening_balance_cents: number
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_number?: string | null
          bank_name?: string | null
          company_id: string
          created_at?: string
          currency?: string
          current_balance_cents?: number
          id?: string
          ifsc?: string | null
          is_active?: boolean
          metadata?: Json
          name: string
          opening_balance_cents?: number
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_number?: string | null
          bank_name?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          current_balance_cents?: number
          id?: string
          ifsc?: string | null
          is_active?: boolean
          metadata?: Json
          name?: string
          opening_balance_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliations: {
        Row: {
          bank_account_id: string
          book_balance_cents: number
          company_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          difference_cents: number
          id: string
          notes: string | null
          period_end: string
          period_start: string
          statement_balance_cents: number
          status: Database["public"]["Enums"]["fin_recon_status"]
          updated_at: string
        }
        Insert: {
          bank_account_id: string
          book_balance_cents?: number
          company_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          difference_cents?: number
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          statement_balance_cents?: number
          status?: Database["public"]["Enums"]["fin_recon_status"]
          updated_at?: string
        }
        Update: {
          bank_account_id?: string
          book_balance_cents?: number
          company_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          difference_cents?: number
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          statement_balance_cents?: number
          status?: Database["public"]["Enums"]["fin_recon_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount_cents: number
          bank_account_id: string
          company_id: string
          counterparty: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          journal_entry_id: string | null
          metadata: Json
          reconciled: boolean
          reconciled_at: string | null
          reference: string | null
          txn_date: string
          txn_type: Database["public"]["Enums"]["fin_bank_txn_type"]
        }
        Insert: {
          amount_cents: number
          bank_account_id: string
          company_id: string
          counterparty?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
          metadata?: Json
          reconciled?: boolean
          reconciled_at?: string | null
          reference?: string | null
          txn_date?: string
          txn_type: Database["public"]["Enums"]["fin_bank_txn_type"]
        }
        Update: {
          amount_cents?: number
          bank_account_id?: string
          company_id?: string
          counterparty?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
          metadata?: Json
          reconciled?: boolean
          reconciled_at?: string | null
          reference?: string | null
          txn_date?: string
          txn_type?: Database["public"]["Enums"]["fin_bank_txn_type"]
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_alert_events: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          company_id: string
          created_at: string
          id: string
          message: string
          metric_key: string
          observed_value: number | null
          payload: Json
          rule_id: string | null
          scope: string
          severity: string
          threshold_value: number | null
          triggered_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          company_id: string
          created_at?: string
          id?: string
          message: string
          metric_key: string
          observed_value?: number | null
          payload?: Json
          rule_id?: string | null
          scope: string
          severity?: string
          threshold_value?: number | null
          triggered_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          message?: string
          metric_key?: string
          observed_value?: number | null
          payload?: Json
          rule_id?: string | null
          scope?: string
          severity?: string
          threshold_value?: number | null
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bi_alert_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bi_alert_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_forecasts: {
        Row: {
          company_id: string
          confidence: number | null
          created_at: string
          forecast_points: Json
          generated_by: string | null
          history_from: string
          history_points: Json
          history_to: string
          horizon_days: number
          id: string
          method: string
          metric_key: string
          scope: string
        }
        Insert: {
          company_id: string
          confidence?: number | null
          created_at?: string
          forecast_points?: Json
          generated_by?: string | null
          history_from: string
          history_points?: Json
          history_to: string
          horizon_days: number
          id?: string
          method?: string
          metric_key: string
          scope: string
        }
        Update: {
          company_id?: string
          confidence?: number | null
          created_at?: string
          forecast_points?: Json
          generated_by?: string | null
          history_from?: string
          history_points?: Json
          history_to?: string
          horizon_days?: number
          id?: string
          method?: string
          metric_key?: string
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "bi_forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_insights: {
        Row: {
          company_id: string
          created_at: string
          facts: Json
          id: string
          kind: string
          period_end: string | null
          period_start: string | null
          recommendations: Json
          scope: string
          severity: string
          source: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          facts?: Json
          id?: string
          kind?: string
          period_end?: string | null
          period_start?: string | null
          recommendations?: Json
          scope: string
          severity?: string
          source?: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          facts?: Json
          id?: string
          kind?: string
          period_end?: string | null
          period_start?: string | null
          recommendations?: Json
          scope?: string
          severity?: string
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "bi_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_report_definitions: {
        Row: {
          category: string
          code: string
          company_id: string
          created_at: string
          created_by: string | null
          delivery: Json
          description: string | null
          id: string
          is_system: boolean
          name: string
          query_spec: Json
          schedule: string | null
          scope: string
          updated_at: string
          visualization: Json
        }
        Insert: {
          category?: string
          code: string
          company_id: string
          created_at?: string
          created_by?: string | null
          delivery?: Json
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          query_spec?: Json
          schedule?: string | null
          scope?: string
          updated_at?: string
          visualization?: Json
        }
        Update: {
          category?: string
          code?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          delivery?: Json
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          query_spec?: Json
          schedule?: string | null
          scope?: string
          updated_at?: string
          visualization?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bi_report_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_report_runs: {
        Row: {
          code: string
          company_id: string
          created_at: string
          definition_id: string | null
          duration_ms: number | null
          error: string | null
          format: string
          id: string
          output: Json
          period_end: string | null
          period_start: string | null
          requested_by: string | null
          status: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          definition_id?: string | null
          duration_ms?: number | null
          error?: string | null
          format?: string
          id?: string
          output?: Json
          period_end?: string | null
          period_start?: string | null
          requested_by?: string | null
          status?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          definition_id?: string | null
          duration_ms?: number | null
          error?: string | null
          format?: string
          id?: string
          output?: Json
          period_end?: string | null
          period_start?: string | null
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bi_report_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bi_report_runs_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "bi_report_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_snapshots: {
        Row: {
          company_id: string
          computed_at: string
          created_at: string
          id: string
          metric_key: string
          period_end: string
          period_grain: string
          period_start: string
          scope: string
          source: string
          updated_at: string
          value_json: Json
          value_numeric: number | null
        }
        Insert: {
          company_id: string
          computed_at?: string
          created_at?: string
          id?: string
          metric_key: string
          period_end: string
          period_grain: string
          period_start: string
          scope: string
          source?: string
          updated_at?: string
          value_json?: Json
          value_numeric?: number | null
        }
        Update: {
          company_id?: string
          computed_at?: string
          created_at?: string
          id?: string
          metric_key?: string
          period_end?: string
          period_grain?: string
          period_start?: string
          scope?: string
          source?: string
          updated_at?: string
          value_json?: Json
          value_numeric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bi_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_of_materials: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          product_id: string
          status: string
          uom: string
          updated_at: string
          version: number
          yield_quantity: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          product_id: string
          status?: string
          uom?: string
          updated_at?: string
          version?: number
          yield_quantity?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          product_id?: string
          status?: string
          uom?: string
          updated_at?: string
          version?: number
          yield_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_of_materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_of_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bkp_artifacts: {
        Row: {
          checksum: string
          created_at: string
          id: string
          job_id: string
          metadata: Json
          object_count: number
          size_bytes: number
          storage_ref: string | null
          target: string
        }
        Insert: {
          checksum: string
          created_at?: string
          id?: string
          job_id: string
          metadata?: Json
          object_count?: number
          size_bytes?: number
          storage_ref?: string | null
          target: string
        }
        Update: {
          checksum?: string
          created_at?: string
          id?: string
          job_id?: string
          metadata?: Json
          object_count?: number
          size_bytes?: number
          storage_ref?: string | null
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "bkp_artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bkp_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      bkp_audit_events: {
        Row: {
          actor_id: string | null
          id: string
          kind: string
          message: string
          metadata: Json
          occurred_at: string
          ref_id: string | null
          ref_type: string
          severity: string
        }
        Insert: {
          actor_id?: string | null
          id?: string
          kind: string
          message: string
          metadata?: Json
          occurred_at?: string
          ref_id?: string | null
          ref_type: string
          severity?: string
        }
        Update: {
          actor_id?: string | null
          id?: string
          kind?: string
          message?: string
          metadata?: Json
          occurred_at?: string
          ref_id?: string | null
          ref_type?: string
          severity?: string
        }
        Relationships: []
      }
      bkp_jobs: {
        Row: {
          backup_type: string
          checksum: string | null
          compression: string | null
          created_at: string
          created_by: string | null
          duration_ms: number | null
          encryption_algo: string | null
          error: string | null
          finished_at: string | null
          id: string
          metadata: Json
          object_count: number
          parent_job_id: string | null
          policy_id: string | null
          size_bytes: number
          started_at: string
          status: string
          storage_ref: string | null
          target: string
          trigger: string
          updated_at: string
          verification_checksum: string | null
          verified_at: string | null
        }
        Insert: {
          backup_type?: string
          checksum?: string | null
          compression?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          encryption_algo?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          object_count?: number
          parent_job_id?: string | null
          policy_id?: string | null
          size_bytes?: number
          started_at?: string
          status?: string
          storage_ref?: string | null
          target: string
          trigger?: string
          updated_at?: string
          verification_checksum?: string | null
          verified_at?: string | null
        }
        Update: {
          backup_type?: string
          checksum?: string | null
          compression?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          encryption_algo?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          object_count?: number
          parent_job_id?: string | null
          policy_id?: string | null
          size_bytes?: number
          started_at?: string
          status?: string
          storage_ref?: string | null
          target?: string
          trigger?: string
          updated_at?: string
          verification_checksum?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bkp_jobs_parent_job_id_fkey"
            columns: ["parent_job_id"]
            isOneToOne: false
            referencedRelation: "bkp_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bkp_jobs_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "bkp_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      bkp_policies: {
        Row: {
          backup_type: string
          compression: string
          created_at: string
          created_by: string | null
          deduplication: boolean
          description: string | null
          enabled: boolean
          encryption_algo: string
          id: string
          name: string
          retention_daily: number
          retention_monthly: number
          retention_weekly: number
          retention_yearly: number
          schedule_cron: string | null
          target_scope: string
          updated_at: string
        }
        Insert: {
          backup_type?: string
          compression?: string
          created_at?: string
          created_by?: string | null
          deduplication?: boolean
          description?: string | null
          enabled?: boolean
          encryption_algo?: string
          id?: string
          name: string
          retention_daily?: number
          retention_monthly?: number
          retention_weekly?: number
          retention_yearly?: number
          schedule_cron?: string | null
          target_scope: string
          updated_at?: string
        }
        Update: {
          backup_type?: string
          compression?: string
          created_at?: string
          created_by?: string | null
          deduplication?: boolean
          description?: string | null
          enabled?: boolean
          encryption_algo?: string
          id?: string
          name?: string
          retention_daily?: number
          retention_monthly?: number
          retention_weekly?: number
          retention_yearly?: number
          schedule_cron?: string | null
          target_scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      bkp_recovery_drills: {
        Row: {
          created_at: string
          created_by: string | null
          duration_ms: number | null
          error: string | null
          findings: Json
          finished_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          steps_result: Json
          updated_at: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error?: string | null
          findings?: Json
          finished_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          steps_result?: Json
          updated_at?: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error?: string | null
          findings?: Json
          finished_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          steps_result?: Json
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bkp_recovery_drills_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bkp_recovery_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      bkp_recovery_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          id: string
          last_drill_at: string | null
          last_drill_status: string | null
          name: string
          owner_id: string | null
          rpo_minutes: number
          rto_minutes: number
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          last_drill_at?: string | null
          last_drill_status?: string | null
          name: string
          owner_id?: string | null
          rpo_minutes?: number
          rto_minutes?: number
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          last_drill_at?: string | null
          last_drill_status?: string | null
          name?: string
          owner_id?: string | null
          rpo_minutes?: number
          rto_minutes?: number
          steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      bkp_restore_jobs: {
        Row: {
          created_at: string
          created_by: string | null
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          metadata: Json
          mode: string
          restored_objects: number
          scope: Json
          source_job_id: string | null
          started_at: string
          status: string
          target: string
          updated_at: string
          verification_checksum: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          mode?: string
          restored_objects?: number
          scope?: Json
          source_job_id?: string | null
          started_at?: string
          status?: string
          target: string
          updated_at?: string
          verification_checksum?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          mode?: string
          restored_objects?: number
          scope?: Json
          source_job_id?: string | null
          started_at?: string
          status?: string
          target?: string
          updated_at?: string
          verification_checksum?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bkp_restore_jobs_source_job_id_fkey"
            columns: ["source_job_id"]
            isOneToOne: false
            referencedRelation: "bkp_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_items: {
        Row: {
          bom_id: string
          component_product_id: string
          created_at: string
          id: string
          notes: string | null
          quantity: number
          scrap_pct: number
          uom: string
        }
        Insert: {
          bom_id: string
          component_product_id: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity: number
          scrap_pct?: number
          uom?: string
        }
        Update: {
          bom_id?: string
          component_product_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          scrap_pct?: number
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bill_of_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_decisions: {
        Row: {
          candidates: Json
          chosen: string
          company_id: string
          created_at: string
          decision_type: string
          facts: Json
          id: string
          rationale: string
          recommendation: Json
          session_id: string
        }
        Insert: {
          candidates?: Json
          chosen: string
          company_id: string
          created_at?: string
          decision_type: string
          facts?: Json
          id?: string
          rationale: string
          recommendation?: Json
          session_id: string
        }
        Update: {
          candidates?: Json
          chosen?: string
          company_id?: string
          created_at?: string
          decision_type?: string
          facts?: Json
          id?: string
          rationale?: string
          recommendation?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_decisions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "brain_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_intents: {
        Row: {
          action: string | null
          alternatives: Json
          chosen_runtime: string | null
          company_id: string
          confidence: number
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          intent: string
          reasoning: string | null
          session_id: string
        }
        Insert: {
          action?: string | null
          alternatives?: Json
          chosen_runtime?: string | null
          company_id: string
          confidence?: number
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          intent: string
          reasoning?: string | null
          session_id: string
        }
        Update: {
          action?: string | null
          alternatives?: Json
          chosen_runtime?: string | null
          company_id?: string
          confidence?: number
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          intent?: string
          reasoning?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_intents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_intents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "brain_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_plans: {
        Row: {
          alternatives: Json
          company_id: string
          created_at: string
          dependencies: Json
          goal: string
          id: string
          intent_id: string | null
          requires_confirmation: boolean
          risks: Json
          session_id: string
          status: string
          steps: Json
          updated_at: string
        }
        Insert: {
          alternatives?: Json
          company_id: string
          created_at?: string
          dependencies?: Json
          goal: string
          id?: string
          intent_id?: string | null
          requires_confirmation?: boolean
          risks?: Json
          session_id: string
          status?: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          alternatives?: Json
          company_id?: string
          created_at?: string
          dependencies?: Json
          goal?: string
          id?: string
          intent_id?: string | null
          requires_confirmation?: boolean
          risks?: Json
          session_id?: string
          status?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_plans_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "brain_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_plans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "brain_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_sessions: {
        Row: {
          channel: string | null
          company_id: string
          completed_at: string | null
          context: Json
          created_at: string
          founder_mode: boolean
          id: string
          input: string | null
          source: string
          started_at: string
          status: string
          summary: string | null
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          channel?: string | null
          company_id: string
          completed_at?: string | null
          context?: Json
          created_at?: string
          founder_mode?: boolean
          id?: string
          input?: string | null
          source: string
          started_at?: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          channel?: string | null
          company_id?: string
          completed_at?: string | null
          context?: Json
          created_at?: string
          founder_mode?: boolean
          id?: string
          input?: string | null
          source?: string
          started_at?: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brain_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_tool_calls: {
        Row: {
          ai_recommendation: Json
          args: Json
          company_id: string
          confirmed_by: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          plan_id: string | null
          requires_confirmation: boolean
          result_facts: Json
          runtime: string
          session_id: string
          status: string
          tool: string
          user_id: string | null
        }
        Insert: {
          ai_recommendation?: Json
          args?: Json
          company_id: string
          confirmed_by?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          plan_id?: string | null
          requires_confirmation?: boolean
          result_facts?: Json
          runtime: string
          session_id: string
          status?: string
          tool: string
          user_id?: string | null
        }
        Update: {
          ai_recommendation?: Json
          args?: Json
          company_id?: string
          confirmed_by?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          plan_id?: string | null
          requires_confirmation?: boolean
          result_facts?: Json
          runtime?: string
          session_id?: string
          status?: string
          tool?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brain_tool_calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_tool_calls_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "brain_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_tool_calls_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "brain_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          company_id: string
          created_at: string
          id: string
          logo_url: string | null
          metadata: Json
          name: string
          primary_color: string | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          tagline: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          logo_url?: string | null
          metadata?: Json
          name: string
          primary_color?: string | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          metadata?: Json
          name?: string
          primary_color?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_units: {
        Row: {
          code: string | null
          company_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      capability_health_checks: {
        Row: {
          capability_code: string
          checked_at: string
          checked_by: string | null
          evidence: Json
          id: string
          latency_ms: number | null
          status: string
          verification_method: string
        }
        Insert: {
          capability_code: string
          checked_at?: string
          checked_by?: string | null
          evidence?: Json
          id?: string
          latency_ms?: number | null
          status: string
          verification_method: string
        }
        Update: {
          capability_code?: string
          checked_at?: string
          checked_by?: string | null
          evidence?: Json
          id?: string
          latency_ms?: number | null
          status?: string
          verification_method?: string
        }
        Relationships: []
      }
      capability_registry: {
        Row: {
          code: string
          created_at: string
          dependencies: string[]
          description: string | null
          id: string
          label: string
          metadata: Json
          owner: string | null
          release_id: string
          runtime: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          code: string
          created_at?: string
          dependencies?: string[]
          description?: string | null
          id?: string
          label: string
          metadata?: Json
          owner?: string | null
          release_id: string
          runtime: string
          status?: string
          updated_at?: string
          version?: string
        }
        Update: {
          code?: string
          created_at?: string
          dependencies?: string[]
          description?: string | null
          id?: string
          label?: string
          metadata?: Json
          owner?: string | null
          release_id?: string
          runtime?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          company_id: string | null
          course_id: string | null
          created_at: string
          id: string
          issued_at: string
          metadata: Json
          serial: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          metadata?: Json
          serial: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          metadata?: Json
          serial?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_reports: {
        Row: {
          blocked_items: Json
          capability_matrix: Json
          created_at: string
          dependency_matrix: Json
          facts: Json
          generated_by: string
          health_matrix: Json
          id: string
          overall_status: string
          performance_matrix: Json
          readiness_score: number
          recommendations: Json
          release_id: string
          risk_matrix: Json
          security_matrix: Json
          version: string
        }
        Insert: {
          blocked_items?: Json
          capability_matrix?: Json
          created_at?: string
          dependency_matrix?: Json
          facts?: Json
          generated_by: string
          health_matrix?: Json
          id?: string
          overall_status: string
          performance_matrix?: Json
          readiness_score?: number
          recommendations?: Json
          release_id: string
          risk_matrix?: Json
          security_matrix?: Json
          version: string
        }
        Update: {
          blocked_items?: Json
          capability_matrix?: Json
          created_at?: string
          dependency_matrix?: Json
          facts?: Json
          generated_by?: string
          health_matrix?: Json
          id?: string
          overall_status?: string
          performance_matrix?: Json
          readiness_score?: number
          recommendations?: Json
          release_id?: string
          risk_matrix?: Json
          security_matrix?: Json
          version?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          code: string
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          id: string
          is_active: boolean
          kind: string
          name: string
          parent_id: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          kind: string
          name: string
          parent_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_contents: {
        Row: {
          archived_at: string | null
          author_id: string
          body: Json
          categories: string[]
          company_id: string | null
          cover_url: string | null
          created_at: string
          editor_id: string | null
          excerpt: string | null
          id: string
          locale: string
          metadata: Json
          parent_id: string | null
          published_at: string | null
          publisher_id: string | null
          review_note: string | null
          reviewer_id: string | null
          scheduled_at: string | null
          search_tsv: unknown
          seo: Json
          slug: string
          status: string
          tags: string[]
          title: string
          type: string
          updated_at: string
          version: number
          visibility: string
        }
        Insert: {
          archived_at?: string | null
          author_id: string
          body?: Json
          categories?: string[]
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          editor_id?: string | null
          excerpt?: string | null
          id?: string
          locale?: string
          metadata?: Json
          parent_id?: string | null
          published_at?: string | null
          publisher_id?: string | null
          review_note?: string | null
          reviewer_id?: string | null
          scheduled_at?: string | null
          search_tsv?: unknown
          seo?: Json
          slug: string
          status?: string
          tags?: string[]
          title: string
          type: string
          updated_at?: string
          version?: number
          visibility?: string
        }
        Update: {
          archived_at?: string | null
          author_id?: string
          body?: Json
          categories?: string[]
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          editor_id?: string | null
          excerpt?: string | null
          id?: string
          locale?: string
          metadata?: Json
          parent_id?: string | null
          published_at?: string | null
          publisher_id?: string | null
          review_note?: string | null
          reviewer_id?: string | null
          scheduled_at?: string | null
          search_tsv?: unknown
          seo?: Json
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_contents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_contents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media: {
        Row: {
          archived_at: string | null
          asset_id: string | null
          checksum: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          folder_id: string | null
          height: number | null
          id: string
          kind: string
          metadata: Json
          mime_type: string | null
          name: string
          size_bytes: number | null
          tags: string[]
          updated_at: string
          url: string
          version: number
          width: number | null
        }
        Insert: {
          archived_at?: string | null
          asset_id?: string | null
          checksum?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          folder_id?: string | null
          height?: number | null
          id?: string
          kind: string
          metadata?: Json
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          tags?: string[]
          updated_at?: string
          url: string
          version?: number
          width?: number | null
        }
        Update: {
          archived_at?: string | null
          asset_id?: string | null
          checksum?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          folder_id?: string | null
          height?: number | null
          id?: string
          kind?: string
          metadata?: Json
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          tags?: string[]
          updated_at?: string
          url?: string
          version?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_media_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_media_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "cms_media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media_folders: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
          path: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
          path: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_revisions: {
        Row: {
          author_id: string | null
          content_id: string
          created_at: string
          id: string
          note: string | null
          snapshot: Json
          version: number
        }
        Insert: {
          author_id?: string | null
          content_id: string
          created_at?: string
          id?: string
          note?: string | null
          snapshot: Json
          version: number
        }
        Update: {
          author_id?: string | null
          content_id?: string
          created_at?: string
          id?: string
          note?: string | null
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_revisions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "cms_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_translations: {
        Row: {
          body: Json
          content_id: string
          created_at: string
          excerpt: string | null
          id: string
          locale: string
          status: string
          title: string
          translator_id: string | null
          updated_at: string
        }
        Insert: {
          body?: Json
          content_id: string
          created_at?: string
          excerpt?: string | null
          id?: string
          locale: string
          status?: string
          title: string
          translator_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: Json
          content_id?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          locale?: string
          status?: string
          title?: string
          translator_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_translations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "cms_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          reaction_count: number
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          version: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          reaction_count?: number
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          reaction_count?: number
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          country: string | null
          created_at: string
          display_name: string
          id: string
          legal_name: string
          logo_url: string | null
          metadata: Json
          owner_id: string | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          tagline: string | null
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name: string
          id?: string
          legal_name: string
          logo_url?: string | null
          metadata?: Json
          owner_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          tagline?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          legal_name?: string
          logo_url?: string | null
          metadata?: Json
          owner_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          tagline?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          created_at: string
          granted: boolean
          granted_at: string
          id: string
          ip: unknown
          policy_version: string | null
          purpose: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted: boolean
          granted_at?: string
          id?: string
          ip?: unknown
          policy_version?: string | null
          purpose: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip?: unknown
          policy_version?: string | null
          purpose?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_uploads: {
        Row: {
          company_id: string | null
          course_id: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          kind: string
          lesson_id: string | null
          metadata: Json
          size_bytes: number | null
          status: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          company_id?: string | null
          course_id?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          kind: string
          lesson_id?: string | null
          metadata?: Json
          size_bytes?: number | null
          status?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          company_id?: string | null
          course_id?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          kind?: string
          lesson_id?: string | null
          metadata?: Json
          size_bytes?: number | null
          status?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_uploads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_uploads_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_uploads_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          code3: string | null
          created_at: string
          currency_code: string | null
          dial_code: string | null
          is_active: boolean
          name: string
          region: string | null
        }
        Insert: {
          code: string
          code3?: string | null
          created_at?: string
          currency_code?: string | null
          dial_code?: string | null
          is_active?: boolean
          name: string
          region?: string | null
        }
        Update: {
          code?: string
          code3?: string | null
          created_at?: string
          currency_code?: string | null
          dial_code?: string | null
          is_active?: boolean
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          company_id: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          enrolled_at: string
          id: string
          progress_pct: number
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
          updated_by: string | null
          user_id: string
          version: number
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          enrolled_at?: string
          id?: string
          progress_pct?: number
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
          version?: number
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          enrolled_at?: string
          id?: string
          progress_pct?: number
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          company_id: string | null
          course_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          position: number
          status: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          company_id?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          company_id?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["record_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          company_id: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          duration_minutes: number | null
          id: string
          is_public: boolean
          language: string | null
          level: string | null
          metadata: Json
          price_cents: number
          slug: string
          status: Database["public"]["Enums"]["record_status"]
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_public?: boolean
          language?: string | null
          level?: string | null
          metadata?: Json
          price_cents?: number
          slug: string
          status?: Database["public"]["Enums"]["record_status"]
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_public?: boolean
          language?: string | null
          level?: string | null
          metadata?: Json
          price_cents?: number
          slug?: string
          status?: Database["public"]["Enums"]["record_status"]
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_assets: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          duration_seconds: number | null
          height: number | null
          id: string
          kind: string
          metadata: Json
          mime_type: string | null
          owner_id: string
          project_id: string | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["record_status"]
          storage_path: string
          title: string | null
          updated_at: string
          updated_by: string | null
          version: number
          width: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind: string
          metadata?: Json
          mime_type?: string | null
          owner_id: string
          project_id?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["record_status"]
          storage_path: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          width?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: string
          metadata?: Json
          mime_type?: string | null
          owner_id?: string
          project_id?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["record_status"]
          storage_path?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "creative_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_projects: {
        Row: {
          company_id: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          kind: string
          metadata: Json
          owner_id: string
          status: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
          workspace_id: string | null
        }
        Insert: {
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          owner_id: string
          status?: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string | null
        }
        Update: {
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          owner_id?: string
          status?: Database["public"]["Enums"]["record_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_assets: {
        Row: {
          created_at: string
          data_url: string | null
          duration_ms: number | null
          external_url: string | null
          height: number | null
          id: string
          kind: string
          metadata: Json
          mime_type: string
          model: string | null
          name: string
          project_id: string | null
          prompt: string | null
          size_bytes: number | null
          tags: string[]
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          data_url?: string | null
          duration_ms?: number | null
          external_url?: string | null
          height?: number | null
          id?: string
          kind: string
          metadata?: Json
          mime_type?: string
          model?: string | null
          name: string
          project_id?: string | null
          prompt?: string | null
          size_bytes?: number | null
          tags?: string[]
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          data_url?: string | null
          duration_ms?: number | null
          external_url?: string | null
          height?: number | null
          id?: string
          kind?: string
          metadata?: Json
          mime_type?: string
          model?: string | null
          name?: string
          project_id?: string | null
          prompt?: string | null
          size_bytes?: number | null
          tags?: string[]
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "creator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_brand_kits: {
        Row: {
          accent_color: string
          body_font: string
          company_id: string | null
          created_at: string
          heading_font: string
          id: string
          is_default: boolean
          logo_asset_id: string | null
          metadata: Json
          name: string
          primary_color: string
          secondary_color: string
          updated_at: string
          user_id: string
          voice_guide: string | null
        }
        Insert: {
          accent_color?: string
          body_font?: string
          company_id?: string | null
          created_at?: string
          heading_font?: string
          id?: string
          is_default?: boolean
          logo_asset_id?: string | null
          metadata?: Json
          name: string
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          user_id: string
          voice_guide?: string | null
        }
        Update: {
          accent_color?: string
          body_font?: string
          company_id?: string | null
          created_at?: string
          heading_font?: string
          id?: string
          is_default?: boolean
          logo_asset_id?: string | null
          metadata?: Json
          name?: string
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          user_id?: string
          voice_guide?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_brand_kits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_brand_kits_logo_asset_id_fkey"
            columns: ["logo_asset_id"]
            isOneToOne: false
            referencedRelation: "creator_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_generations: {
        Row: {
          cost_credits: number | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input: Json
          model: string | null
          operation: string
          output_asset_id: string | null
          project_id: string | null
          prompt: string | null
          status: string
          studio: string
          user_id: string
        }
        Insert: {
          cost_credits?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json
          model?: string | null
          operation: string
          output_asset_id?: string | null
          project_id?: string | null
          prompt?: string | null
          status?: string
          studio: string
          user_id: string
        }
        Update: {
          cost_credits?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json
          model?: string | null
          operation?: string
          output_asset_id?: string | null
          project_id?: string | null
          prompt?: string | null
          status?: string
          studio?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_generations_output_asset_id_fkey"
            columns: ["output_asset_id"]
            isOneToOne: false
            referencedRelation: "creator_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "creator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_payouts: {
        Row: {
          amount_cents: number
          created_at: string
          creator_id: string
          currency: string
          failed_reason: string | null
          id: string
          initiated_at: string
          metadata: Json
          method: string
          reference: string | null
          settled_at: string | null
          status: string
          updated_at: string
          wallet_ledger_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          creator_id: string
          currency?: string
          failed_reason?: string | null
          id?: string
          initiated_at?: string
          metadata?: Json
          method: string
          reference?: string | null
          settled_at?: string | null
          status?: string
          updated_at?: string
          wallet_ledger_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          creator_id?: string
          currency?: string
          failed_reason?: string | null
          id?: string
          initiated_at?: string
          metadata?: Json
          method?: string
          reference?: string | null
          settled_at?: string | null
          status?: string
          updated_at?: string
          wallet_ledger_id?: string | null
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          follower_count: number
          metadata: Json
          payout_currency: string
          payout_method: Json
          status: string
          total_downloads: number
          total_revenue_cents: number
          updated_at: string
          user_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          follower_count?: number
          metadata?: Json
          payout_currency?: string
          payout_method?: Json
          status?: string
          total_downloads?: number
          total_revenue_cents?: number
          updated_at?: string
          user_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          follower_count?: number
          metadata?: Json
          payout_currency?: string
          payout_method?: Json
          status?: string
          total_downloads?: number
          total_revenue_cents?: number
          updated_at?: string
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      creator_projects: {
        Row: {
          archived: boolean
          company_id: string | null
          cover_asset_id: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          metadata: Json
          name: string
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          company_id?: string | null
          cover_asset_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name: string
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          company_id?: string | null
          cover_asset_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_support_tickets: {
        Row: {
          body: string
          buyer_id: string
          created_at: string
          creator_id: string
          id: string
          last_message_at: string
          listing_id: string | null
          metadata: Json
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          buyer_id: string
          created_at?: string
          creator_id: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
          metadata?: Json
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          buyer_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
          metadata?: Json
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_support_tickets_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_debit_notes: {
        Row: {
          amount_cents: number
          bill_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          kind: Database["public"]["Enums"]["fin_note_kind"]
          metadata: Json
          note_date: string
          number: string
          reason: string | null
          status: string
          supplier_id: string | null
          tax_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          bill_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          kind: Database["public"]["Enums"]["fin_note_kind"]
          metadata?: Json
          note_date?: string
          number: string
          reason?: string | null
          status?: string
          supplier_id?: string | null
          tax_cents?: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          bill_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          kind?: Database["public"]["Enums"]["fin_note_kind"]
          metadata?: Json
          note_date?: string
          number?: string
          reason?: string | null
          status?: string
          supplier_id?: string | null
          tax_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_debit_notes_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "vendor_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_debit_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_debit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_debit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_debit_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger_entries: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          direction: Database["public"]["Enums"]["ledger_direction"]
          entry_type: Database["public"]["Enums"]["credit_entry_type"]
          expires_at: string | null
          id: string
          metadata: Json
          owner_id: string
          owner_type: Database["public"]["Enums"]["wallet_owner_type"]
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction: Database["public"]["Enums"]["ledger_direction"]
          entry_type: Database["public"]["Enums"]["credit_entry_type"]
          expires_at?: string | null
          id?: string
          metadata?: Json
          owner_id: string
          owner_type: Database["public"]["Enums"]["wallet_owner_type"]
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction?: Database["public"]["Enums"]["ledger_direction"]
          entry_type?: Database["public"]["Enums"]["credit_entry_type"]
          expires_at?: string | null
          id?: string
          metadata?: Json
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["wallet_owner_type"]
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: []
      }
      crm_notes: {
        Row: {
          attachments: Json
          author_id: string
          body: string
          company_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          pinned: boolean
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_id?: string
          body: string
          company_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_id?: string
          body?: string
          company_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assignee_id: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          kind: string
          metadata: Json
          priority: string
          recurrence: string | null
          reminder_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          metadata?: Json
          priority?: string
          recurrence?: string | null
          reminder_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          metadata?: Json
          priority?: string
          recurrence?: string | null
          reminder_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_runs: {
        Row: {
          created_at: string
          duration_ms: number | null
          finished_at: string | null
          id: string
          job_name: string
          message: string | null
          metadata: Json
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          finished_at?: string | null
          id?: string
          job_name: string
          message?: string | null
          metadata?: Json
          started_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          finished_at?: string | null
          id?: string
          job_name?: string
          message?: string | null
          metadata?: Json
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          decimals: number
          is_active: boolean
          name: string
          symbol: string | null
        }
        Insert: {
          code: string
          created_at?: string
          decimals?: number
          is_active?: boolean
          name: string
          symbol?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          decimals?: number
          is_active?: boolean
          name?: string
          symbol?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          billing_address: Json
          brand_id: string | null
          code: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          metadata: Json
          name: string
          phone: string | null
          shipping_address: Json
          status: Database["public"]["Enums"]["record_status"]
          tax_id: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          billing_address?: Json
          brand_id?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json
          name: string
          phone?: string | null
          shipping_address?: Json
          status?: Database["public"]["Enums"]["record_status"]
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          billing_address?: Json
          brand_id?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json
          name?: string
          phone?: string | null
          shipping_address?: Json
          status?: Database["public"]["Enums"]["record_status"]
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_count_items: {
        Row: {
          bin_id: string | null
          count_id: string
          counted_qty: number | null
          created_at: string
          expected_qty: number
          id: string
          lot_id: string | null
          product_id: string
          reason: string | null
          variance: number | null
        }
        Insert: {
          bin_id?: string | null
          count_id: string
          counted_qty?: number | null
          created_at?: string
          expected_qty?: number
          id?: string
          lot_id?: string | null
          product_id: string
          reason?: string | null
          variance?: number | null
        }
        Update: {
          bin_id?: string | null
          count_id?: string
          counted_qty?: number | null
          created_at?: string
          expected_qty?: number
          id?: string
          lot_id?: string | null
          product_id?: string
          reason?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cycle_count_items_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_count_items_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "cycle_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_count_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_counts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          completed_at: string | null
          counted_by: string | null
          created_at: string
          created_by: string | null
          id: string
          is_blind: boolean
          notes: string | null
          number: string
          scheduled_at: string
          scope: Json
          started_at: string | null
          status: Database["public"]["Enums"]["wms_count_status"]
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          completed_at?: string | null
          counted_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_blind?: boolean
          notes?: string | null
          number: string
          scheduled_at?: string
          scope?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["wms_count_status"]
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          completed_at?: string | null
          counted_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_blind?: boolean
          notes?: string | null
          number?: string
          scheduled_at?: string
          scope?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["wms_count_status"]
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_counts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_counts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      data_requests: {
        Row: {
          created_at: string
          export_url: string | null
          fulfilled_at: string | null
          id: string
          kind: string
          notes: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          export_url?: string | null
          fulfilled_at?: string | null
          id?: string
          kind: string
          notes?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          export_url?: string | null
          fulfilled_at?: string | null
          id?: string
          kind?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          amount_cents: number
          closed_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          deleted_at: string | null
          expected_close_at: string | null
          id: string
          lead_id: string | null
          owner_id: string | null
          probability: number
          stage: Database["public"]["Enums"]["deal_stage"]
          status: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          amount_cents?: number
          closed_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          deleted_at?: string | null
          expected_close_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          probability?: number
          stage?: Database["public"]["Enums"]["deal_stage"]
          status?: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          amount_cents?: number
          closed_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          deleted_at?: string | null
          expected_close_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          probability?: number
          stage?: Database["public"]["Enums"]["deal_stage"]
          status?: Database["public"]["Enums"]["record_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          business_unit_id: string | null
          code: string | null
          company_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          parent_id: string | null
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          business_unit_id?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          parent_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          business_unit_id?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          parent_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      deploy_artifacts: {
        Row: {
          build_id: string
          created_at: string
          filename: string
          id: string
          kind: string
          metadata: Json
          sha256: string | null
          signed: boolean
          signing_identity: string | null
          size_bytes: number
          storage_url: string | null
        }
        Insert: {
          build_id: string
          created_at?: string
          filename: string
          id?: string
          kind: string
          metadata?: Json
          sha256?: string | null
          signed?: boolean
          signing_identity?: string | null
          size_bytes?: number
          storage_url?: string | null
        }
        Update: {
          build_id?: string
          created_at?: string
          filename?: string
          id?: string
          kind?: string
          metadata?: Json
          sha256?: string | null
          signed?: boolean
          signing_identity?: string | null
          size_bytes?: number
          storage_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deploy_artifacts_build_id_fkey"
            columns: ["build_id"]
            isOneToOne: false
            referencedRelation: "deploy_builds"
            referencedColumns: ["id"]
          },
        ]
      }
      deploy_builds: {
        Row: {
          blocked_reason: string | null
          channel: string
          created_at: string
          finished_at: string | null
          git_sha: string | null
          id: string
          logs_url: string | null
          metadata: Json
          platform_code: string
          started_at: string
          started_by: string | null
          status: string
          version: string
        }
        Insert: {
          blocked_reason?: string | null
          channel: string
          created_at?: string
          finished_at?: string | null
          git_sha?: string | null
          id?: string
          logs_url?: string | null
          metadata?: Json
          platform_code: string
          started_at?: string
          started_by?: string | null
          status: string
          version: string
        }
        Update: {
          blocked_reason?: string | null
          channel?: string
          created_at?: string
          finished_at?: string | null
          git_sha?: string | null
          id?: string
          logs_url?: string | null
          metadata?: Json
          platform_code?: string
          started_at?: string
          started_by?: string | null
          status?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "deploy_builds_platform_code_fkey"
            columns: ["platform_code"]
            isOneToOne: false
            referencedRelation: "deploy_platform_registry"
            referencedColumns: ["platform_code"]
          },
        ]
      }
      deploy_platform_registry: {
        Row: {
          adapter: string
          category: string
          created_at: string
          display_name: string
          enabled: boolean
          id: string
          notes: string | null
          platform_code: string
          readiness_state: string
          required_dependencies: Json
          updated_at: string
        }
        Insert: {
          adapter: string
          category: string
          created_at?: string
          display_name: string
          enabled?: boolean
          id?: string
          notes?: string | null
          platform_code: string
          readiness_state?: string
          required_dependencies?: Json
          updated_at?: string
        }
        Update: {
          adapter?: string
          category?: string
          created_at?: string
          display_name?: string
          enabled?: boolean
          id?: string
          notes?: string | null
          platform_code?: string
          readiness_state?: string
          required_dependencies?: Json
          updated_at?: string
        }
        Relationships: []
      }
      deploy_store_readiness: {
        Row: {
          created_at: string
          id: string
          last_checked_at: string
          missing_dependencies: Json
          notes: string | null
          status: string
          store: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_checked_at?: string
          missing_dependencies?: Json
          notes?: string | null
          status?: string
          store: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_checked_at?: string
          missing_dependencies?: Json
          notes?: string | null
          status?: string
          store?: string
          updated_at?: string
        }
        Relationships: []
      }
      deployments: {
        Row: {
          channel: string
          completed_at: string | null
          created_at: string
          id: string
          initiated_by: string | null
          metadata: Json
          notes: string | null
          started_at: string
          status: Database["public"]["Enums"]["deployment_status"]
          strategy: Database["public"]["Enums"]["deployment_strategy"]
          updated_at: string
          version: string
        }
        Insert: {
          channel?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          initiated_by?: string | null
          metadata?: Json
          notes?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["deployment_status"]
          strategy?: Database["public"]["Enums"]["deployment_strategy"]
          updated_at?: string
          version: string
        }
        Update: {
          channel?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          initiated_by?: string | null
          metadata?: Json
          notes?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["deployment_status"]
          strategy?: Database["public"]["Enums"]["deployment_strategy"]
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      dh_integration_events: {
        Row: {
          channel: string
          emitted_at: string
          event_type: string
          id: string
          payload: Json
          seq: number
          session_id: string
          user_id: string
        }
        Insert: {
          channel: string
          emitted_at?: string
          event_type: string
          id?: string
          payload?: Json
          seq: number
          session_id: string
          user_id: string
        }
        Update: {
          channel?: string
          emitted_at?: string
          event_type?: string
          id?: string
          payload?: Json
          seq?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dh_integration_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dh_integration_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dh_integration_sessions: {
        Row: {
          company_id: string | null
          created_at: string
          ended_at: string | null
          happy_session_id: string | null
          id: string
          identity_id: string | null
          last_heartbeat_at: string | null
          latency_ms: number | null
          renderer_code: string
          started_at: string
          status: string
          sync_state: Json
          updated_at: string
          user_id: string
          voice_session_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          ended_at?: string | null
          happy_session_id?: string | null
          id?: string
          identity_id?: string | null
          last_heartbeat_at?: string | null
          latency_ms?: number | null
          renderer_code: string
          started_at?: string
          status?: string
          sync_state?: Json
          updated_at?: string
          user_id: string
          voice_session_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          ended_at?: string | null
          happy_session_id?: string | null
          id?: string
          identity_id?: string | null
          last_heartbeat_at?: string | null
          latency_ms?: number | null
          renderer_code?: string
          started_at?: string
          status?: string
          sync_state?: Json
          updated_at?: string
          user_id?: string
          voice_session_id?: string | null
        }
        Relationships: []
      }
      dh_preferences: {
        Row: {
          camera_consent: boolean
          captions: boolean
          emotion_adaptation: boolean
          high_contrast: boolean
          language: string
          large_text: boolean
          memory_enabled: boolean
          microphone_consent: boolean
          mute_audio: boolean
          reduced_motion: boolean
          speed: number
          updated_at: string
          user_id: string
          voice: string
        }
        Insert: {
          camera_consent?: boolean
          captions?: boolean
          emotion_adaptation?: boolean
          high_contrast?: boolean
          language?: string
          large_text?: boolean
          memory_enabled?: boolean
          microphone_consent?: boolean
          mute_audio?: boolean
          reduced_motion?: boolean
          speed?: number
          updated_at?: string
          user_id: string
          voice?: string
        }
        Update: {
          camera_consent?: boolean
          captions?: boolean
          emotion_adaptation?: boolean
          high_contrast?: boolean
          language?: string
          large_text?: boolean
          memory_enabled?: boolean
          microphone_consent?: boolean
          mute_audio?: boolean
          reduced_motion?: boolean
          speed?: number
          updated_at?: string
          user_id?: string
          voice?: string
        }
        Relationships: []
      }
      dh_presentations: {
        Row: {
          audience: string | null
          company_id: string | null
          created_at: string
          id: string
          slides: Json
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          slides?: Json
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          slides?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dh_presentations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dh_renderer_adapters: {
        Row: {
          capabilities: Json
          code: string
          created_at: string
          enabled: boolean
          id: string
          kind: string
          label: string
          registered_by: string | null
          required_assets: Json
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          code: string
          created_at?: string
          enabled?: boolean
          id?: string
          kind: string
          label: string
          registered_by?: string | null
          required_assets?: Json
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          code?: string
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          label?: string
          registered_by?: string | null
          required_assets?: Json
          updated_at?: string
        }
        Relationships: []
      }
      dh_sessions: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          memory: Json
          mode: string
          surface: string
          title: string | null
          transcript: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          memory?: Json
          mode?: string
          surface?: string
          title?: string | null
          transcript?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          memory?: Json
          mode?: string
          surface?: string
          title?: string | null
          transcript?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dh_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          employee_code: string | null
          hired_on: string | null
          id: string
          manager_id: string | null
          metadata: Json
          office_id: string | null
          status: Database["public"]["Enums"]["entity_status"]
          team_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          employee_code?: string | null
          hired_on?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json
          office_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          team_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          employee_code?: string | null
          hired_on?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json
          office_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          team_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_versions: {
        Row: {
          actor_id: string | null
          company_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          snapshot: Json
          version: number
        }
        Insert: {
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          snapshot: Json
          version: number
        }
        Update: {
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount_cents: number
          attachment_url: string | null
          category: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          id: string
          memo: string | null
          spent_on: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          vendor: string | null
          version: number
        }
        Insert: {
          amount_cents: number
          attachment_url?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          memo?: string | null
          spent_on?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
          version?: number
        }
        Update: {
          amount_cents?: number
          attachment_url?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          memo?: string | null
          spent_on?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          rollout: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          rollout?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          rollout?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      founder_briefings: {
        Row: {
          company_id: string | null
          generated_at: string
          generated_by: string | null
          id: string
          period: string
          period_end: string
          period_start: string
          snapshot: Json
          source_runtimes: string[]
        }
        Insert: {
          company_id?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          period: string
          period_end: string
          period_start: string
          snapshot?: Json
          source_runtimes?: string[]
        }
        Update: {
          company_id?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          period?: string
          period_end?: string
          period_start?: string
          snapshot?: Json
          source_runtimes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "founder_briefings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_business_health_snapshots: {
        Row: {
          company_id: string | null
          computed_by: string
          created_at: string
          dimension: string
          facts: Json
          id: string
          period_end: string
          period_start: string
          recommendations: Json
          score: number
          source_runtimes: string[]
          status: string
        }
        Insert: {
          company_id?: string | null
          computed_by: string
          created_at?: string
          dimension: string
          facts?: Json
          id?: string
          period_end: string
          period_start: string
          recommendations?: Json
          score: number
          source_runtimes?: string[]
          status: string
        }
        Update: {
          company_id?: string | null
          computed_by?: string
          created_at?: string
          dimension?: string
          facts?: Json
          id?: string
          period_end?: string
          period_start?: string
          recommendations?: Json
          score?: number
          source_runtimes?: string[]
          status?: string
        }
        Relationships: []
      }
      founder_command_history: {
        Row: {
          capability: string | null
          command_text: string
          company_id: string | null
          created_at: string
          error: string | null
          id: string
          input_mode: string
          intent: string | null
          latency_ms: number | null
          response: Json
          status: string
          target_runtime: string | null
          user_id: string
        }
        Insert: {
          capability?: string | null
          command_text: string
          company_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_mode?: string
          intent?: string | null
          latency_ms?: number | null
          response?: Json
          status?: string
          target_runtime?: string | null
          user_id: string
        }
        Update: {
          capability?: string | null
          command_text?: string
          company_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_mode?: string
          intent?: string | null
          latency_ms?: number | null
          response?: Json
          status?: string
          target_runtime?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_command_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_decision_records: {
        Row: {
          alternatives: Json
          category: string
          company_id: string | null
          confidence: number
          created_at: string
          decided_by: string
          decision: string
          facts: Json
          id: string
          outcome: string | null
          outcome_recorded_at: string | null
          rationale: string | null
          recommendations_considered: Json
          title: string
        }
        Insert: {
          alternatives?: Json
          category: string
          company_id?: string | null
          confidence?: number
          created_at?: string
          decided_by: string
          decision: string
          facts?: Json
          id?: string
          outcome?: string | null
          outcome_recorded_at?: string | null
          rationale?: string | null
          recommendations_considered?: Json
          title: string
        }
        Update: {
          alternatives?: Json
          category?: string
          company_id?: string | null
          confidence?: number
          created_at?: string
          decided_by?: string
          decision?: string
          facts?: Json
          id?: string
          outcome?: string | null
          outcome_recorded_at?: string | null
          rationale?: string | null
          recommendations_considered?: Json
          title?: string
        }
        Relationships: []
      }
      founder_executive_reports: {
        Row: {
          company_id: string | null
          content: Json
          created_at: string
          facts_count: number
          generated_by: string
          id: string
          period_end: string
          period_start: string
          recommendations_count: number
          report_type: string
          source_runtimes: string[]
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          content: Json
          created_at?: string
          facts_count?: number
          generated_by: string
          id?: string
          period_end: string
          period_start: string
          recommendations_count?: number
          report_type: string
          source_runtimes?: string[]
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          content?: Json
          created_at?: string
          facts_count?: number
          generated_by?: string
          id?: string
          period_end?: string
          period_start?: string
          recommendations_count?: number
          report_type?: string
          source_runtimes?: string[]
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      founder_recommendations: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          body: string | null
          category: string
          company_id: string | null
          confidence: number | null
          created_at: string
          evidence: Json
          expires_at: string | null
          id: string
          kind: string
          source_runtime: string
          status: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          body?: string | null
          category: string
          company_id?: string | null
          confidence?: number | null
          created_at?: string
          evidence?: Json
          expires_at?: string | null
          id?: string
          kind: string
          source_runtime: string
          status?: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          body?: string | null
          category?: string
          company_id?: string | null
          confidence?: number | null
          created_at?: string
          evidence?: Json
          expires_at?: string | null
          id?: string
          kind?: string
          source_runtime?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_recommendations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_workspace_prefs: {
        Row: {
          accessibility: Json
          favorite_dashboards: string[]
          language: string
          pinned_modules: string[]
          recent_projects: string[]
          saved_views: Json
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility?: Json
          favorite_dashboards?: string[]
          language?: string
          pinned_modules?: string[]
          recent_projects?: string[]
          saved_views?: Json
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility?: Json
          favorite_dashboards?: string[]
          language?: string
          pinned_modules?: string[]
          recent_projects?: string[]
          saved_views?: Json
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goods_receipt_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          po_item_id: string | null
          quantity_received: number
          quantity_rejected: number
          receipt_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          po_item_id?: string | null
          quantity_received?: number
          quantity_rejected?: number
          receipt_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          po_item_id?: string | null
          quantity_received?: number
          quantity_rejected?: number
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_items_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          company_id: string
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          number: string
          purchase_order_id: string
          received_at: string
          received_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          number: string
          purchase_order_id: string
          received_at?: string
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          number?: string
          purchase_order_id?: string
          received_at?: string
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          slug: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          version: number
          visibility: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          slug: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
          visibility?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
          visibility?: string
        }
        Relationships: []
      }
      gst_returns: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          filed_at: string | null
          id: string
          input_tax_cents: number
          metadata: Json
          net_payable_cents: number
          output_tax_cents: number
          period_end: string
          period_start: string
          reference: string | null
          status: Database["public"]["Enums"]["fin_gst_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          filed_at?: string | null
          id?: string
          input_tax_cents?: number
          metadata?: Json
          net_payable_cents?: number
          output_tax_cents?: number
          period_end: string
          period_start: string
          reference?: string | null
          status?: Database["public"]["Enums"]["fin_gst_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          filed_at?: string | null
          id?: string
          input_tax_cents?: number
          metadata?: Json
          net_payable_cents?: number
          output_tax_cents?: number
          period_end?: string
          period_start?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["fin_gst_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gst_returns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ha_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: string
          message: string | null
          occurred_at: string
          ref_id: string | null
          ref_type: string | null
          region_id: string | null
          severity: Database["public"]["Enums"]["ha_event_severity"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: string
          message?: string | null
          occurred_at?: string
          ref_id?: string | null
          ref_type?: string | null
          region_id?: string | null
          severity?: Database["public"]["Enums"]["ha_event_severity"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string | null
          occurred_at?: string
          ref_id?: string | null
          ref_type?: string | null
          region_id?: string | null
          severity?: Database["public"]["Enums"]["ha_event_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "ha_events_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "ha_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      ha_failover_runs: {
        Row: {
          created_at: string
          finished_at: string | null
          from_region_id: string | null
          id: string
          kind: Database["public"]["Enums"]["ha_failover_kind"]
          message: string | null
          reason: string
          started_at: string
          started_by: string | null
          status: Database["public"]["Enums"]["ha_failover_status"]
          to_region_id: string | null
          traffic_switched: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          from_region_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["ha_failover_kind"]
          message?: string | null
          reason: string
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["ha_failover_status"]
          to_region_id?: string | null
          traffic_switched?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          from_region_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["ha_failover_kind"]
          message?: string | null
          reason?: string
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["ha_failover_status"]
          to_region_id?: string | null
          traffic_switched?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ha_failover_runs_from_region_id_fkey"
            columns: ["from_region_id"]
            isOneToOne: false
            referencedRelation: "ha_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ha_failover_runs_to_region_id_fkey"
            columns: ["to_region_id"]
            isOneToOne: false
            referencedRelation: "ha_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      ha_regions: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          enabled: boolean
          endpoint_url: string | null
          id: string
          last_probed_at: string | null
          latency_ms: number | null
          location: string | null
          name: string
          priority: number
          provider: string
          role: Database["public"]["Enums"]["ha_region_role"]
          status: Database["public"]["Enums"]["ha_region_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          endpoint_url?: string | null
          id?: string
          last_probed_at?: string | null
          latency_ms?: number | null
          location?: string | null
          name: string
          priority?: number
          provider?: string
          role?: Database["public"]["Enums"]["ha_region_role"]
          status?: Database["public"]["Enums"]["ha_region_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          endpoint_url?: string | null
          id?: string
          last_probed_at?: string | null
          latency_ms?: number | null
          location?: string | null
          name?: string
          priority?: number
          provider?: string
          role?: Database["public"]["Enums"]["ha_region_role"]
          status?: Database["public"]["Enums"]["ha_region_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ha_replication_checks: {
        Row: {
          created_at: string
          id: string
          lag_rows: number
          scope: Database["public"]["Enums"]["ha_replication_scope"]
          source_digest: string
          source_region_id: string
          source_total: number
          status: Database["public"]["Enums"]["ha_replication_status"]
          target_digest: string
          target_region_id: string
          target_total: number
          verified_at: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lag_rows?: number
          scope: Database["public"]["Enums"]["ha_replication_scope"]
          source_digest: string
          source_region_id: string
          source_total?: number
          status: Database["public"]["Enums"]["ha_replication_status"]
          target_digest?: string
          target_region_id: string
          target_total?: number
          verified_at?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lag_rows?: number
          scope?: Database["public"]["Enums"]["ha_replication_scope"]
          source_digest?: string
          source_region_id?: string
          source_total?: number
          status?: Database["public"]["Enums"]["ha_replication_status"]
          target_digest?: string
          target_region_id?: string
          target_total?: number
          verified_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ha_replication_checks_source_region_id_fkey"
            columns: ["source_region_id"]
            isOneToOne: false
            referencedRelation: "ha_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ha_replication_checks_target_region_id_fkey"
            columns: ["target_region_id"]
            isOneToOne: false
            referencedRelation: "ha_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      ha_replication_marks: {
        Row: {
          created_at: string
          digest: string
          id: string
          marked_at: string
          marked_by: string | null
          region_id: string
          scope: Database["public"]["Enums"]["ha_replication_scope"]
          total_rows: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          digest: string
          id?: string
          marked_at?: string
          marked_by?: string | null
          region_id: string
          scope: Database["public"]["Enums"]["ha_replication_scope"]
          total_rows?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          digest?: string
          id?: string
          marked_at?: string
          marked_by?: string | null
          region_id?: string
          scope?: Database["public"]["Enums"]["ha_replication_scope"]
          total_rows?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ha_replication_marks_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "ha_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      ha_traffic_policies: {
        Row: {
          active_region_id: string | null
          created_at: string
          id: string
          policy: Database["public"]["Enums"]["ha_traffic_policy"]
          updated_at: string
          updated_by: string | null
          weights: Json
        }
        Insert: {
          active_region_id?: string | null
          created_at?: string
          id?: string
          policy: Database["public"]["Enums"]["ha_traffic_policy"]
          updated_at?: string
          updated_by?: string | null
          weights?: Json
        }
        Update: {
          active_region_id?: string | null
          created_at?: string
          id?: string
          policy?: Database["public"]["Enums"]["ha_traffic_policy"]
          updated_at?: string
          updated_by?: string | null
          weights?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ha_traffic_policies_active_region_id_fkey"
            columns: ["active_region_id"]
            isOneToOne: false
            referencedRelation: "ha_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_animations: {
        Row: {
          asset_manifest: Json
          asset_url: string | null
          category: string
          clip_code: string
          created_at: string
          duration_ms: number | null
          id: string
          identity_id: string
          label: string
          loops: boolean
          updated_at: string
        }
        Insert: {
          asset_manifest?: Json
          asset_url?: string | null
          category: string
          clip_code: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          identity_id: string
          label: string
          loops?: boolean
          updated_at?: string
        }
        Update: {
          asset_manifest?: Json
          asset_url?: string | null
          category?: string
          clip_code?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          identity_id?: string
          label?: string
          loops?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_animations_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "happy_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_appearance: {
        Row: {
          accessories: Json
          asset_refs: Json
          beard: Json
          body: Json
          clothing: Json
          created_at: string
          environment: Json
          eyes: Json
          face: Json
          hair: Json
          id: string
          identity_id: string
          lighting: Json
          skin: Json
          updated_at: string
        }
        Insert: {
          accessories?: Json
          asset_refs?: Json
          beard?: Json
          body?: Json
          clothing?: Json
          created_at?: string
          environment?: Json
          eyes?: Json
          face?: Json
          hair?: Json
          id?: string
          identity_id: string
          lighting?: Json
          skin?: Json
          updated_at?: string
        }
        Update: {
          accessories?: Json
          asset_refs?: Json
          beard?: Json
          body?: Json
          clothing?: Json
          created_at?: string
          environment?: Json
          eyes?: Json
          face?: Json
          hair?: Json
          id?: string
          identity_id?: string
          lighting?: Json
          skin?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_appearance_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: true
            referencedRelation: "happy_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_asset_validations: {
        Row: {
          created_at: string
          id: string
          kind: string
          manifest_id: string
          missing: Json
          report: Json
          runner: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          manifest_id: string
          missing?: Json
          report?: Json
          runner?: string | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          manifest_id?: string
          missing?: Json
          report?: Json
          runner?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_asset_validations_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "happy_character_manifests"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_asset_versions: {
        Row: {
          asset_id: string
          checksum_sha256: string
          created_at: string
          created_by: string | null
          id: string
          meta: Json
          mime_type: string | null
          published_at: string | null
          size_bytes: number
          status: string
          storage_ref: string
          version: string
        }
        Insert: {
          asset_id: string
          checksum_sha256: string
          created_at?: string
          created_by?: string | null
          id?: string
          meta?: Json
          mime_type?: string | null
          published_at?: string | null
          size_bytes: number
          status?: string
          storage_ref: string
          version: string
        }
        Update: {
          asset_id?: string
          checksum_sha256?: string
          created_at?: string
          created_by?: string | null
          id?: string
          meta?: Json
          mime_type?: string | null
          published_at?: string | null
          size_bytes?: number
          status?: string
          storage_ref?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_asset_versions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "happy_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_assets: {
        Row: {
          asset_type: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          description: string | null
          id: string
          name: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          id?: string
          name: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          id?: string
          name?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_assets_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "happy_asset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_behavior: {
        Row: {
          boundaries: string[]
          created_at: string
          default_persona: boolean
          id: string
          identity_id: string
          mode: string
          system_prompt: string
          temperament: Json
          updated_at: string
        }
        Insert: {
          boundaries?: string[]
          created_at?: string
          default_persona?: boolean
          id?: string
          identity_id: string
          mode: string
          system_prompt: string
          temperament?: Json
          updated_at?: string
        }
        Update: {
          boundaries?: string[]
          created_at?: string
          default_persona?: boolean
          id?: string
          identity_id?: string
          mode?: string
          system_prompt?: string
          temperament?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_behavior_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "happy_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_behavior_profiles: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          default_emotion: string
          default_mood: string
          emotion_weight: number
          gesture_weight: number
          id: string
          is_active: boolean
          label: string
          speech_style: string
          updated_at: string
          weights: Json
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          default_emotion: string
          default_mood: string
          emotion_weight?: number
          gesture_weight?: number
          id?: string
          is_active?: boolean
          label: string
          speech_style?: string
          updated_at?: string
          weights?: Json
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          default_emotion?: string
          default_mood?: string
          emotion_weight?: number
          gesture_weight?: number
          id?: string
          is_active?: boolean
          label?: string
          speech_style?: string
          updated_at?: string
          weights?: Json
        }
        Relationships: []
      }
      happy_change_requests: {
        Row: {
          applied_version_id: string | null
          created_at: string
          id: string
          identity_id: string
          proposed_changes: Json
          rationale: string | null
          request_type: string
          requested_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applied_version_id?: string | null
          created_at?: string
          id?: string
          identity_id: string
          proposed_changes: Json
          rationale?: string | null
          request_type: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applied_version_id?: string | null
          created_at?: string
          id?: string
          identity_id?: string
          proposed_changes?: Json
          rationale?: string | null
          request_type?: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_change_requests_applied_version_id_fkey"
            columns: ["applied_version_id"]
            isOneToOne: false
            referencedRelation: "happy_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "happy_change_requests_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "happy_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_character_manifests: {
        Row: {
          animation_set: Json
          blendshape_profile: string
          character_key: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          published_at: string | null
          rig_meta: Json
          skeleton_meta: Json
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          animation_set?: Json
          blendshape_profile?: string
          character_key?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          published_at?: string | null
          rig_meta?: Json
          skeleton_meta?: Json
          status?: string
          updated_at?: string
          version: string
        }
        Update: {
          animation_set?: Json
          blendshape_profile?: string
          character_key?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          published_at?: string | null
          rig_meta?: Json
          skeleton_meta?: Json
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      happy_conversation_turns: {
        Row: {
          capability: string | null
          created_at: string
          error: string | null
          evidence: Json
          id: string
          intent: string | null
          latency_ms: number | null
          message: string | null
          occurred_at: string
          response: string | null
          role: string
          session_id: string
          tokens_in: number | null
          tokens_out: number | null
          turn_index: number
          user_id: string | null
        }
        Insert: {
          capability?: string | null
          created_at?: string
          error?: string | null
          evidence?: Json
          id?: string
          intent?: string | null
          latency_ms?: number | null
          message?: string | null
          occurred_at?: string
          response?: string | null
          role: string
          session_id: string
          tokens_in?: number | null
          tokens_out?: number | null
          turn_index: number
          user_id?: string | null
        }
        Update: {
          capability?: string | null
          created_at?: string
          error?: string | null
          evidence?: Json
          id?: string
          intent?: string | null
          latency_ms?: number | null
          message?: string | null
          occurred_at?: string
          response?: string | null
          role?: string
          session_id?: string
          tokens_in?: number | null
          tokens_out?: number | null
          turn_index?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "happy_conversation_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "happy_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_deployments: {
        Row: {
          channel: string
          config: Json
          created_at: string
          deployed_at: string | null
          deployed_by: string | null
          id: string
          identity_id: string
          status: string
          updated_at: string
          version_id: string | null
        }
        Insert: {
          channel: string
          config?: Json
          created_at?: string
          deployed_at?: string | null
          deployed_by?: string | null
          id?: string
          identity_id: string
          status?: string
          updated_at?: string
          version_id?: string | null
        }
        Update: {
          channel?: string
          config?: Json
          created_at?: string
          deployed_at?: string | null
          deployed_by?: string | null
          id?: string
          identity_id?: string
          status?: string
          updated_at?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "happy_deployments_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "happy_identity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "happy_deployments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "happy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_emotion_analytics: {
        Row: {
          average_listening_time_ms: number
          average_speaking_energy: number
          company_id: string | null
          conversation_quality: number
          created_at: string
          emotion_distribution: Json
          expression_usage: Json
          gesture_distribution: Json
          happy_session_id: string | null
          id: string
          mode_distribution: Json
          sample_count: number
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          average_listening_time_ms?: number
          average_speaking_energy?: number
          company_id?: string | null
          conversation_quality?: number
          created_at?: string
          emotion_distribution?: Json
          expression_usage?: Json
          gesture_distribution?: Json
          happy_session_id?: string | null
          id?: string
          mode_distribution?: Json
          sample_count?: number
          user_id: string
          window_end: string
          window_start: string
        }
        Update: {
          average_listening_time_ms?: number
          average_speaking_energy?: number
          company_id?: string | null
          conversation_quality?: number
          created_at?: string
          emotion_distribution?: Json
          expression_usage?: Json
          gesture_distribution?: Json
          happy_session_id?: string | null
          id?: string
          mode_distribution?: Json
          sample_count?: number
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      happy_emotion_events: {
        Row: {
          behavior_mode: string
          company_id: string | null
          confidence: number
          context: Json
          conversation_turn_id: string | null
          created_at: string
          emotion: string
          emotion_weight: number
          evidence: Json
          happy_session_id: string | null
          id: string
          mood: string
          mood_weight: number
          presence: string
          source: string
          user_id: string
          voice_session_id: string | null
        }
        Insert: {
          behavior_mode: string
          company_id?: string | null
          confidence: number
          context?: Json
          conversation_turn_id?: string | null
          created_at?: string
          emotion: string
          emotion_weight?: number
          evidence?: Json
          happy_session_id?: string | null
          id?: string
          mood: string
          mood_weight?: number
          presence: string
          source: string
          user_id: string
          voice_session_id?: string | null
        }
        Update: {
          behavior_mode?: string
          company_id?: string | null
          confidence?: number
          context?: Json
          conversation_turn_id?: string | null
          created_at?: string
          emotion?: string
          emotion_weight?: number
          evidence?: Json
          happy_session_id?: string | null
          id?: string
          mood?: string
          mood_weight?: number
          presence?: string
          source?: string
          user_id?: string
          voice_session_id?: string | null
        }
        Relationships: []
      }
      happy_expression_frames: {
        Row: {
          attention_level: number
          blink: boolean
          body_pose: string
          breathing_level: number
          brow_intent: number
          company_id: string | null
          created_at: string
          double_blink: boolean
          duration_ms: number
          emotion_event_id: string | null
          eye_open: number
          hand_gesture: string
          happy_session_id: string | null
          head_tilt: number
          head_turn: number
          id: string
          interest_level: number
          jaw_intent: number
          meta: Json
          shoulder_intent: number
          smile_amount: number
          speaking_energy: number
          t_ms: number
          user_id: string
          viseme_sync_ref: string | null
        }
        Insert: {
          attention_level?: number
          blink?: boolean
          body_pose?: string
          breathing_level?: number
          brow_intent?: number
          company_id?: string | null
          created_at?: string
          double_blink?: boolean
          duration_ms?: number
          emotion_event_id?: string | null
          eye_open?: number
          hand_gesture?: string
          happy_session_id?: string | null
          head_tilt?: number
          head_turn?: number
          id?: string
          interest_level?: number
          jaw_intent?: number
          meta?: Json
          shoulder_intent?: number
          smile_amount?: number
          speaking_energy?: number
          t_ms: number
          user_id: string
          viseme_sync_ref?: string | null
        }
        Update: {
          attention_level?: number
          blink?: boolean
          body_pose?: string
          breathing_level?: number
          brow_intent?: number
          company_id?: string | null
          created_at?: string
          double_blink?: boolean
          duration_ms?: number
          emotion_event_id?: string | null
          eye_open?: number
          hand_gesture?: string
          happy_session_id?: string | null
          head_tilt?: number
          head_turn?: number
          id?: string
          interest_level?: number
          jaw_intent?: number
          meta?: Json
          shoulder_intent?: number
          smile_amount?: number
          speaking_energy?: number
          t_ms?: number
          user_id?: string
          viseme_sync_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "happy_expression_frames_emotion_event_id_fkey"
            columns: ["emotion_event_id"]
            isOneToOne: false
            referencedRelation: "happy_emotion_events"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_gesture_intents: {
        Row: {
          company_id: string | null
          confidence: number
          created_at: string
          duration_ms: number
          emotion_event_id: string | null
          happy_session_id: string | null
          id: string
          intensity: number
          intent: string
          reason: string | null
          target: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          confidence?: number
          created_at?: string
          duration_ms?: number
          emotion_event_id?: string | null
          happy_session_id?: string | null
          id?: string
          intensity?: number
          intent: string
          reason?: string | null
          target?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          confidence?: number
          created_at?: string
          duration_ms?: number
          emotion_event_id?: string | null
          happy_session_id?: string | null
          id?: string
          intensity?: number
          intent?: string
          reason?: string | null
          target?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_gesture_intents_emotion_event_id_fkey"
            columns: ["emotion_event_id"]
            isOneToOne: false
            referencedRelation: "happy_emotion_events"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_greeting_templates: {
        Row: {
          audience: string | null
          channel: string | null
          created_at: string
          enabled: boolean
          id: string
          key: string
          locale: string
          priority: number
          template: string
          time_of_day: string | null
          updated_at: string
        }
        Insert: {
          audience?: string | null
          channel?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          locale?: string
          priority?: number
          template: string
          time_of_day?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string | null
          channel?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          locale?: string
          priority?: number
          template?: string
          time_of_day?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      happy_identity: {
        Row: {
          active_version_id: string | null
          biography: string | null
          brand: string
          company: string
          created_at: string
          id: string
          languages: string[]
          mission: string | null
          official_name: string
          primary_language: string
          role_title: string
          singleton: boolean
          status: string
          updated_at: string
          updated_by: string | null
          vision: string | null
        }
        Insert: {
          active_version_id?: string | null
          biography?: string | null
          brand?: string
          company?: string
          created_at?: string
          id?: string
          languages?: string[]
          mission?: string | null
          official_name?: string
          primary_language?: string
          role_title?: string
          singleton?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
          vision?: string | null
        }
        Update: {
          active_version_id?: string | null
          biography?: string | null
          brand?: string
          company?: string
          created_at?: string
          id?: string
          languages?: string[]
          mission?: string | null
          official_name?: string
          primary_language?: string
          role_title?: string
          singleton?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "happy_identity_active_version_fk"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "happy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_knowledge_refs: {
        Row: {
          created_at: string
          id: string
          identity_id: string
          label: string
          priority: number
          ref_id: string | null
          ref_key: string | null
          ref_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          identity_id: string
          label: string
          priority?: number
          ref_id?: string | null
          ref_key?: string | null
          ref_type: string
        }
        Update: {
          created_at?: string
          id?: string
          identity_id?: string
          label?: string
          priority?: number
          ref_id?: string | null
          ref_key?: string | null
          ref_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_knowledge_refs_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "happy_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_manifest_assets: {
        Row: {
          asset_version_id: string
          created_at: string
          id: string
          manifest_id: string
          required: boolean
          role: string
          slot: string | null
        }
        Insert: {
          asset_version_id: string
          created_at?: string
          id?: string
          manifest_id: string
          required?: boolean
          role: string
          slot?: string | null
        }
        Update: {
          asset_version_id?: string
          created_at?: string
          id?: string
          manifest_id?: string
          required?: boolean
          role?: string
          slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "happy_manifest_assets_asset_version_id_fkey"
            columns: ["asset_version_id"]
            isOneToOne: false
            referencedRelation: "happy_asset_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "happy_manifest_assets_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "happy_character_manifests"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_mode_transitions: {
        Row: {
          actor: string | null
          from_mode: string | null
          id: string
          occurred_at: string
          reason: string | null
          session_id: string
          to_mode: string
        }
        Insert: {
          actor?: string | null
          from_mode?: string | null
          id?: string
          occurred_at?: string
          reason?: string | null
          session_id: string
          to_mode: string
        }
        Update: {
          actor?: string | null
          from_mode?: string | null
          id?: string
          occurred_at?: string
          reason?: string | null
          session_id?: string
          to_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_mode_transitions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "happy_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_mood_snapshots: {
        Row: {
          average_attention: number
          average_energy: number
          behavior_mode: string
          company_id: string | null
          created_at: string
          happy_session_id: string | null
          id: string
          meta: Json
          mood: string
          sample_count: number
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          average_attention?: number
          average_energy?: number
          behavior_mode: string
          company_id?: string | null
          created_at?: string
          happy_session_id?: string | null
          id?: string
          meta?: Json
          mood: string
          sample_count?: number
          user_id: string
          window_end: string
          window_start: string
        }
        Update: {
          average_attention?: number
          average_energy?: number
          behavior_mode?: string
          company_id?: string | null
          created_at?: string
          happy_session_id?: string | null
          id?: string
          meta?: Json
          mood?: string
          sample_count?: number
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      happy_presence_events: {
        Row: {
          id: string
          note: string | null
          occurred_at: string
          presence: string
          session_id: string
        }
        Insert: {
          id?: string
          note?: string | null
          occurred_at?: string
          presence: string
          session_id: string
        }
        Update: {
          id?: string
          note?: string | null
          occurred_at?: string
          presence?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_presence_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "happy_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_sessions: {
        Row: {
          audience: string
          channel: string
          client_meta: Json
          company_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          language: string
          last_activity_at: string
          mode: string
          persona: string
          presence: string
          started_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          audience: string
          channel: string
          client_meta?: Json
          company_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          language?: string
          last_activity_at?: string
          mode: string
          persona: string
          presence?: string
          started_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          audience?: string
          channel?: string
          client_meta?: Json
          company_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          language?: string
          last_activity_at?: string
          mode?: string
          persona?: string
          presence?: string
          started_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      happy_skills: {
        Row: {
          category: string
          config: Json
          created_at: string
          enabled: boolean
          id: string
          identity_id: string
          label: string
          required_permissions: string[]
          runtime_route: string
          skill_code: string
          updated_at: string
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          identity_id: string
          label: string
          required_permissions?: string[]
          runtime_route: string
          skill_code: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          identity_id?: string
          label?: string
          required_permissions?: string[]
          runtime_route?: string
          skill_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_skills_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "happy_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          checksum: string
          created_at: string
          created_by: string | null
          id: string
          identity_id: string
          notes: string | null
          published_at: string | null
          rolled_back_at: string | null
          snapshot: Json
          status: string
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          checksum: string
          created_at?: string
          created_by?: string | null
          id?: string
          identity_id: string
          notes?: string | null
          published_at?: string | null
          rolled_back_at?: string | null
          snapshot: Json
          status?: string
          version: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          checksum?: string
          created_at?: string
          created_by?: string | null
          id?: string
          identity_id?: string
          notes?: string | null
          published_at?: string | null
          rolled_back_at?: string | null
          snapshot?: Json
          status?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_versions_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "happy_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_voice: {
        Row: {
          business_tone: Json
          created_at: string
          emotion: string | null
          founder_tone: Json
          greeting_sample: string | null
          id: string
          identity_id: string
          is_primary: boolean
          language: string
          pause_style: string | null
          pitch: number
          provider: string
          speed: number
          teaching_tone: Json
          updated_at: string
          voice_id: string
        }
        Insert: {
          business_tone?: Json
          created_at?: string
          emotion?: string | null
          founder_tone?: Json
          greeting_sample?: string | null
          id?: string
          identity_id: string
          is_primary?: boolean
          language: string
          pause_style?: string | null
          pitch?: number
          provider?: string
          speed?: number
          teaching_tone?: Json
          updated_at?: string
          voice_id: string
        }
        Update: {
          business_tone?: Json
          created_at?: string
          emotion?: string | null
          founder_tone?: Json
          greeting_sample?: string | null
          id?: string
          identity_id?: string
          is_primary?: boolean
          language?: string
          pause_style?: string | null
          pitch?: number
          provider?: string
          speed?: number
          teaching_tone?: Json
          updated_at?: string
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_voice_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "happy_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      health_checks: {
        Row: {
          checked_at: string
          created_at: string
          id: string
          kind: string
          latency_ms: number | null
          message: string | null
          metadata: Json
          service: string
          status: Database["public"]["Enums"]["health_status"]
        }
        Insert: {
          checked_at?: string
          created_at?: string
          id?: string
          kind?: string
          latency_ms?: number | null
          message?: string | null
          metadata?: Json
          service: string
          status?: Database["public"]["Enums"]["health_status"]
        }
        Update: {
          checked_at?: string
          created_at?: string
          id?: string
          kind?: string
          latency_ms?: number | null
          message?: string | null
          metadata?: Json
          service?: string
          status?: Database["public"]["Enums"]["health_status"]
        }
        Relationships: []
      }
      hl_alerts: {
        Row: {
          body: string | null
          city: string | null
          created_at: string
          expires_at: string | null
          id: string
          kind: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          pincode: string | null
          place_id: string | null
          posted_by: string
          radius_km: number | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          city?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          pincode?: string | null
          place_id?: string | null
          posted_by: string
          radius_km?: number | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          city?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          pincode?: string | null
          place_id?: string | null
          posted_by?: string
          radius_km?: number | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hl_alerts_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "hl_places"
            referencedColumns: ["id"]
          },
        ]
      }
      hl_businesses: {
        Row: {
          address: string | null
          category: string
          city: string | null
          company_id: string | null
          created_at: string
          description: string | null
          email: string | null
          hours: Json
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          name: string
          offers: Json
          owner_id: string
          phone: string | null
          photos: Json
          pincode: string | null
          place_id: string | null
          rating_avg: number
          rating_count: number
          slug: string | null
          status: string
          subcategory: string | null
          updated_at: string
          verification_status: string
          verified: boolean
          videos: Json
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          category: string
          city?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          name: string
          offers?: Json
          owner_id: string
          phone?: string | null
          photos?: Json
          pincode?: string | null
          place_id?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          verification_status?: string
          verified?: boolean
          videos?: Json
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          name?: string
          offers?: Json
          owner_id?: string
          phone?: string | null
          photos?: Json
          pincode?: string | null
          place_id?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          verification_status?: string
          verified?: boolean
          videos?: Json
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hl_businesses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hl_businesses_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "hl_places"
            referencedColumns: ["id"]
          },
        ]
      }
      hl_events: {
        Row: {
          category: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          organizer_id: string
          pincode: string | null
          place_id: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          organizer_id: string
          pincode?: string | null
          place_id?: string | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          organizer_id?: string
          pincode?: string | null
          place_id?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hl_events_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "hl_places"
            referencedColumns: ["id"]
          },
        ]
      }
      hl_jobs: {
        Row: {
          business_id: string | null
          category: string | null
          city: string | null
          contact: string | null
          created_at: string
          currency: string | null
          description: string | null
          expires_at: string | null
          id: string
          job_type: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          pay_max: number | null
          pay_min: number | null
          pincode: string | null
          place_id: string | null
          posted_by: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          job_type?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          pay_max?: number | null
          pay_min?: number | null
          pincode?: string | null
          place_id?: string | null
          posted_by: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          category?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          job_type?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          pay_max?: number | null
          pay_min?: number | null
          pincode?: string | null
          place_id?: string | null
          posted_by?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hl_jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "hl_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hl_jobs_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "hl_places"
            referencedColumns: ["id"]
          },
        ]
      }
      hl_places: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          created_by: string
          district: string | null
          id: string
          label: string | null
          latitude: number | null
          locality: string | null
          longitude: number | null
          metadata: Json
          pincode: string | null
          state: string | null
          town: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          district?: string | null
          id?: string
          label?: string | null
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          metadata?: Json
          pincode?: string | null
          state?: string | null
          town?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          district?: string | null
          id?: string
          label?: string | null
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          metadata?: Json
          pincode?: string | null
          state?: string | null
          town?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      hl_reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hl_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "hl_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      hl_user_location: {
        Row: {
          allow_background: boolean
          allow_precise: boolean
          city: string | null
          last_latitude: number | null
          last_longitude: number | null
          last_place_id: string | null
          pincode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_background?: boolean
          allow_precise?: boolean
          city?: string | null
          last_latitude?: number | null
          last_longitude?: number | null
          last_place_id?: string | null
          pincode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_background?: boolean
          allow_precise?: boolean
          city?: string | null
          last_latitude?: number | null
          last_longitude?: number | null
          last_place_id?: string | null
          pincode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hl_user_location_last_place_id_fkey"
            columns: ["last_place_id"]
            isOneToOne: false
            referencedRelation: "hl_places"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          incident_id: string
          kind: string
          message: string
          metadata: Json
          occurred_at: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          incident_id: string
          kind: string
          message: string
          metadata?: Json
          occurred_at?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          incident_id?: string
          kind?: string
          message?: string
          metadata?: Json
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_events_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          opened_at: string
          opened_by: string | null
          resolved_at: string | null
          root_cause: string | null
          service: string
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          opened_at?: string
          opened_by?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          service: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          opened_at?: string
          opened_by?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          service?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          company_id: string
          config: Json
          connected_at: string | null
          connected_by: string | null
          created_at: string
          created_by: string | null
          credentials_ref: string | null
          deleted_at: string | null
          id: string
          provider: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          company_id: string
          config?: Json
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          deleted_at?: string | null
          id?: string
          provider: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          company_id?: string
          config?: Json
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          deleted_at?: string | null
          id?: string
          provider?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          company_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          reorder_point: number
          reserved: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          reorder_point?: number
          reserved?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reorder_point?: number
          reserved?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          batch_no: string | null
          bin_id: string | null
          company_id: string
          created_at: string
          expiry_date: string | null
          id: string
          lot_no: string | null
          metadata: Json
          mfg_date: string | null
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["wms_lot_status"]
          supplier_id: string | null
          unit_cost: number | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          batch_no?: string | null
          bin_id?: string | null
          company_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          lot_no?: string | null
          metadata?: Json
          mfg_date?: string | null
          product_id: string
          quantity?: number
          status?: Database["public"]["Enums"]["wms_lot_status"]
          supplier_id?: string | null
          unit_cost?: number | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          batch_no?: string | null
          bin_id?: string | null
          company_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          lot_no?: string | null
          metadata?: Json
          mfg_date?: string | null
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["wms_lot_status"]
          supplier_id?: string | null
          unit_cost?: number | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_thresholds: {
        Row: {
          company_id: string
          created_at: string
          expiry_alert_days: number
          id: string
          max_stock: number | null
          min_stock: number
          product_id: string
          reorder_level: number
          safety_stock: number
          updated_at: string
          valuation: Database["public"]["Enums"]["wms_valuation"]
          warehouse_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          expiry_alert_days?: number
          id?: string
          max_stock?: number | null
          min_stock?: number
          product_id: string
          reorder_level?: number
          safety_stock?: number
          updated_at?: string
          valuation?: Database["public"]["Enums"]["wms_valuation"]
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          expiry_alert_days?: number
          id?: string
          max_stock?: number | null
          min_stock?: number
          product_id?: string
          reorder_level?: number
          safety_stock?: number
          updated_at?: string
          valuation?: Database["public"]["Enums"]["wms_valuation"]
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_thresholds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_thresholds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_thresholds_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          actor_id: string | null
          balance_after: number | null
          bin_id: string | null
          company_id: string
          created_at: string
          id: string
          lot_id: string | null
          metadata: Json
          notes: string | null
          product_id: string
          qty_delta: number
          ref_id: string | null
          ref_number: string | null
          ref_type: string | null
          txn_type: Database["public"]["Enums"]["wms_txn_type"]
          unit_cost: number | null
          warehouse_id: string
        }
        Insert: {
          actor_id?: string | null
          balance_after?: number | null
          bin_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          lot_id?: string | null
          metadata?: Json
          notes?: string | null
          product_id: string
          qty_delta: number
          ref_id?: string | null
          ref_number?: string | null
          ref_type?: string | null
          txn_type: Database["public"]["Enums"]["wms_txn_type"]
          unit_cost?: number | null
          warehouse_id: string
        }
        Update: {
          actor_id?: string | null
          balance_after?: number | null
          bin_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          lot_id?: string | null
          metadata?: Json
          notes?: string | null
          product_id?: string
          qty_delta?: number
          ref_id?: string | null
          ref_number?: string | null
          ref_type?: string | null
          txn_type?: Database["public"]["Enums"]["wms_txn_type"]
          unit_cost?: number | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number
          tax_cents: number
          total_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity?: number
          tax_cents?: number
          total_cents?: number
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number
          tax_cents?: number
          total_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid_cents: number
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          deleted_at: string | null
          due_at: string | null
          id: string
          issued_at: string | null
          notes: string | null
          number: string
          paid_at: string | null
          sales_order_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          amount_paid_cents?: number
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number: string
          paid_at?: string | null
          sales_order_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          amount_paid_cents?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number?: string
          paid_at?: string | null
          sales_order_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          company_id: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          kind: string
          max_attempts: number
          payload: Json
          priority: number
          run_after: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          max_attempts?: number
          payload?: Json
          priority?: number
          run_after?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          max_attempts?: number
          payload?: Json
          priority?: number
          run_after?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          entry_date: string
          id: string
          memo: string | null
          metadata: Json
          number: string
          posted_at: string | null
          posted_by: string | null
          reference_id: string | null
          reference_number: string | null
          reference_type: string | null
          reversal_of: string | null
          reversed_by: string | null
          status: Database["public"]["Enums"]["fin_journal_status"]
          total_credit_cents: number
          total_debit_cents: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          entry_date?: string
          id?: string
          memo?: string | null
          metadata?: Json
          number: string
          posted_at?: string | null
          posted_by?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          reversal_of?: string | null
          reversed_by?: string | null
          status?: Database["public"]["Enums"]["fin_journal_status"]
          total_credit_cents?: number
          total_debit_cents?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          entry_date?: string
          id?: string
          memo?: string | null
          metadata?: Json
          number?: string
          posted_at?: string | null
          posted_by?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          reversal_of?: string | null
          reversed_by?: string | null
          status?: Database["public"]["Enums"]["fin_journal_status"]
          total_credit_cents?: number
          total_debit_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          contact_id: string | null
          contact_type: string | null
          created_at: string
          credit_cents: number
          debit_cents: number
          entry_id: string
          id: string
          memo: string | null
          metadata: Json
          sort_order: number
          tax_rate_id: string | null
        }
        Insert: {
          account_id: string
          contact_id?: string | null
          contact_type?: string | null
          created_at?: string
          credit_cents?: number
          debit_cents?: number
          entry_id: string
          id?: string
          memo?: string | null
          metadata?: Json
          sort_order?: number
          tax_rate_id?: string | null
        }
        Update: {
          account_id?: string
          contact_id?: string | null
          contact_type?: string | null
          created_at?: string
          credit_cents?: number
          debit_cents?: number
          entry_id?: string
          id?: string
          memo?: string | null
          metadata?: Json
          sort_order?: number
          tax_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      kg_entities: {
        Row: {
          attributes: Json
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          label: string
          owner_user_id: string | null
          ref_id: string | null
          ref_table: string | null
          search_tsv: unknown
          slug: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          attributes?: Json
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          label: string
          owner_user_id?: string | null
          ref_id?: string | null
          ref_table?: string | null
          search_tsv?: unknown
          slug?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          attributes?: Json
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          label?: string
          owner_user_id?: string | null
          ref_id?: string | null
          ref_table?: string | null
          search_tsv?: unknown
          slug?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kg_entities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      kg_inferences: {
        Row: {
          company_id: string | null
          confidence: number
          created_at: string
          created_by: string | null
          evidence: Json
          from_entity_id: string | null
          id: string
          rationale: string
          relation: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          to_entity_id: string | null
        }
        Insert: {
          company_id?: string | null
          confidence: number
          created_at?: string
          created_by?: string | null
          evidence?: Json
          from_entity_id?: string | null
          id?: string
          rationale: string
          relation: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_entity_id?: string | null
        }
        Update: {
          company_id?: string | null
          confidence?: number
          created_at?: string
          created_by?: string | null
          evidence?: Json
          from_entity_id?: string | null
          id?: string
          rationale?: string
          relation?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_entity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kg_inferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kg_inferences_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "kg_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kg_inferences_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "kg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      kg_relations: {
        Row: {
          company_id: string | null
          confidence: number
          created_at: string
          created_by: string | null
          evidence: Json
          from_entity_id: string
          id: string
          relation: string
          source: string | null
          to_entity_id: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          verified: boolean
          weight: number
        }
        Insert: {
          company_id?: string | null
          confidence?: number
          created_at?: string
          created_by?: string | null
          evidence?: Json
          from_entity_id: string
          id?: string
          relation: string
          source?: string | null
          to_entity_id: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          verified?: boolean
          weight?: number
        }
        Update: {
          company_id?: string | null
          confidence?: number
          created_at?: string
          created_by?: string | null
          evidence?: Json
          from_entity_id?: string
          id?: string
          relation?: string
          source?: string | null
          to_entity_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          verified?: boolean
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "kg_relations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kg_relations_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "kg_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kg_relations_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "kg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      kg_search_cache: {
        Row: {
          company_id: string | null
          created_at: string
          expires_at: string
          hit_count: number
          hits: Json
          id: string
          query_hash: string
          query_text: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          expires_at?: string
          hit_count?: number
          hits?: Json
          id?: string
          query_hash: string
          query_text: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          expires_at?: string
          hit_count?: number
          hits?: Json
          id?: string
          query_hash?: string
          query_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "kg_search_cache_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          body: string
          category_id: string | null
          company_id: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_public: boolean
          language: string
          search_vector: unknown
          slug: string
          status: Database["public"]["Enums"]["record_status"]
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          body: string
          category_id?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_public?: boolean
          language?: string
          search_vector?: unknown
          slug: string
          status?: Database["public"]["Enums"]["record_status"]
          summary?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          body?: string
          category_id?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_public?: boolean
          language?: string
          search_vector?: unknown
          slug?: string
          status?: Database["public"]["Enums"]["record_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_categories: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          position: number
          slug: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_references: {
        Row: {
          article_id: string
          created_at: string
          id: string
          label: string
          position: number
          url: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          label: string
          position?: number
          url?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          label?: string
          position?: number
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_references_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          is_rtl: boolean
          name: string
          native_name: string | null
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          is_rtl?: boolean
          name: string
          native_name?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          is_rtl?: boolean
          name?: string
          native_name?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          brand_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          phone: string | null
          score: number
          source: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          brand_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          score?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          brand_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          score?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "leads_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_items: {
        Row: {
          created_at: string
          id: string
          item_ref: string
          item_type: string
          path_id: string
          required: boolean
          seq: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_ref: string
          item_type: string
          path_id: string
          required?: boolean
          seq: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          item_ref?: string
          item_type?: string
          path_id?: string
          required?: boolean
          seq?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_items_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          audience: string
          category: string
          code: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          metadata: Json
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          audience?: string
          category: string
          code: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          metadata?: Json
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          audience?: string
          category?: string
          code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          metadata?: Json
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          account_id: string
          company_id: string
          created_at: string
          created_by: string | null
          credit_cents: number
          currency: string
          debit_cents: number
          entry_date: string
          id: string
          memo: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          account_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          credit_cents?: number
          currency?: string
          debit_cents?: number
          entry_date: string
          id?: string
          memo?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          account_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          credit_cents?: number
          currency?: string
          debit_cents?: number
          entry_date?: string
          id?: string
          memo?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          created_at: string
          enrollment_id: string | null
          id: string
          last_seen_at: string
          lesson_id: string
          metadata: Json
          progress_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          enrollment_id?: string | null
          id?: string
          last_seen_at?: string
          lesson_id: string
          metadata?: Json
          progress_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          enrollment_id?: string | null
          id?: string
          last_seen_at?: string
          lesson_id?: string
          metadata?: Json
          progress_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          company_id: string | null
          content: Json
          course_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          duration_seconds: number | null
          id: string
          kind: string
          media_url: string | null
          module_id: string
          position: number
          status: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          company_id?: string | null
          content?: Json
          course_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          id?: string
          kind?: string
          media_url?: string | null
          module_id: string
          position?: number
          status?: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          company_id?: string | null
          content?: Json
          course_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          id?: string
          kind?: string
          media_url?: string | null
          module_id?: string
          position?: number
          status?: Database["public"]["Enums"]["record_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_downloads: {
        Row: {
          artifact_path: string | null
          buyer_id: string
          created_at: string
          id: string
          ip_hash: string | null
          listing_id: string
          metadata: Json
          purchase_id: string | null
          user_agent: string | null
          version: number
        }
        Insert: {
          artifact_path?: string | null
          buyer_id: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          listing_id: string
          metadata?: Json
          purchase_id?: string | null
          user_agent?: string | null
          version: number
        }
        Update: {
          artifact_path?: string | null
          buyer_id?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          listing_id?: string
          metadata?: Json
          purchase_id?: string | null
          user_agent?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_downloads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_downloads_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "listing_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_purchases: {
        Row: {
          buyer_id: string
          created_at: string
          credit_ledger_id: string | null
          currency: string
          id: string
          listing_id: string
          metadata: Json
          price_cents: number
          price_credits: number
          purchase_type: string
          refunded_at: string | null
          seller_id: string
          status: string
          transaction_id: string | null
          updated_at: string
          version_at_purchase: number
          wallet_ledger_id: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          credit_ledger_id?: string | null
          currency?: string
          id?: string
          listing_id: string
          metadata?: Json
          price_cents?: number
          price_credits?: number
          purchase_type: string
          refunded_at?: string | null
          seller_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          version_at_purchase: number
          wallet_ledger_id?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          credit_ledger_id?: string | null
          currency?: string
          id?: string
          listing_id?: string
          metadata?: Json
          price_cents?: number
          price_credits?: number
          purchase_type?: string
          refunded_at?: string | null
          seller_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          version_at_purchase?: number
          wallet_ledger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_purchases_credit_ledger_id_fkey"
            columns: ["credit_ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_purchases_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "marketplace_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_purchases_wallet_ledger_id_fkey"
            columns: ["wallet_ledger_id"]
            isOneToOne: false
            referencedRelation: "wallet_ledger_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          reviewer_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_versions: {
        Row: {
          artifact_bytes: number | null
          artifact_path: string | null
          changelog: string | null
          created_at: string
          created_by: string | null
          id: string
          listing_id: string
          metadata: Json
          updated_at: string
          version: number
        }
        Insert: {
          artifact_bytes?: number | null
          artifact_path?: string | null
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          listing_id: string
          metadata?: Json
          updated_at?: string
          version: number
        }
        Update: {
          artifact_bytes?: number | null
          artifact_path?: string | null
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          listing_id?: string
          metadata?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_versions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_wishlist: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_wishlist_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          artifact_path: string | null
          asset_type: string
          category: string | null
          company_id: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          currency: string
          current_version: number
          deleted_at: string | null
          description: string | null
          download_count: number
          favorite_count: number
          id: string
          long_description: string | null
          metadata: Json
          preview_urls: Json
          price_cents: number
          price_credits: number
          product_id: string | null
          published_at: string | null
          purchase_type: string
          rating_avg: number
          rating_count: number
          rejected_reason: string | null
          review_status: string
          seller_id: string
          slug: string
          status: Database["public"]["Enums"]["record_status"]
          subscription_plan_id: string | null
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
          view_count: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          artifact_path?: string | null
          asset_type?: string
          category?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          current_version?: number
          deleted_at?: string | null
          description?: string | null
          download_count?: number
          favorite_count?: number
          id?: string
          long_description?: string | null
          metadata?: Json
          preview_urls?: Json
          price_cents?: number
          price_credits?: number
          product_id?: string | null
          published_at?: string | null
          purchase_type?: string
          rating_avg?: number
          rating_count?: number
          rejected_reason?: string | null
          review_status?: string
          seller_id: string
          slug: string
          status?: Database["public"]["Enums"]["record_status"]
          subscription_plan_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          view_count?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          artifact_path?: string | null
          asset_type?: string
          category?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          current_version?: number
          deleted_at?: string | null
          description?: string | null
          download_count?: number
          favorite_count?: number
          id?: string
          long_description?: string | null
          metadata?: Json
          preview_urls?: Json
          price_cents?: number
          price_credits?: number
          product_id?: string | null
          published_at?: string | null
          purchase_type?: string
          rating_avg?: number
          rating_count?: number
          rejected_reason?: string | null
          review_status?: string
          seller_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["record_status"]
          subscription_plan_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_downtime: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          machine_id: string
          notes: string | null
          reason: string
          started_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          machine_id: string
          notes?: string | null
          reason?: string
          started_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          machine_id?: string
          notes?: string | null
          reason?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_downtime_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_downtime_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          capacity_per_hour: number | null
          code: string
          company_id: string
          created_at: string
          id: string
          kind: string
          metadata: Json
          name: string
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          capacity_per_hour?: number | null
          code: string
          company_id: string
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          name: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          capacity_per_hour?: number | null
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          name?: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_orders: {
        Row: {
          company_id: string
          created_at: string
          id: string
          kind: string
          machine_id: string
          notes: string | null
          performed_at: string | null
          performed_by: string | null
          scheduled_for: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          kind?: string
          machine_id: string
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          kind?: string
          machine_id?: string
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_transactions: {
        Row: {
          amount_cents: number
          buyer_id: string
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          listing_id: string | null
          provider: string | null
          provider_ref: string | null
          seller_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          listing_id?: string | null
          provider?: string | null
          provider_ref?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          listing_id?: string | null
          provider?: string | null
          provider_ref?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          bucket: string
          checksum: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          duration_seconds: number | null
          height: number | null
          id: string
          metadata: Json
          mime_type: string | null
          owner_id: string
          path: string
          size_bytes: number | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          version: number
          width: number | null
        }
        Insert: {
          bucket: string
          checksum?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          owner_id: string
          path: string
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
          width?: number | null
        }
        Update: {
          bucket?: string
          checksum?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          owner_id?: string
          path?: string
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_action_items: {
        Row: {
          agenda_item_id: string | null
          assignee_email: string | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          id: string
          linked_task_id: string | null
          meeting_id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agenda_item_id?: string | null
          assignee_email?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          id?: string
          linked_task_id?: string | null
          meeting_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agenda_item_id?: string | null
          assignee_email?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          id?: string
          linked_task_id?: string | null
          meeting_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "meeting_agenda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_agenda_items: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_id: string
          owner_user_id: string | null
          seq: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_id: string
          owner_user_id?: string | null
          seq: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_id?: string
          owner_user_id?: string | null
          seq?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_decisions: {
        Row: {
          agenda_item_id: string | null
          confidence: number
          created_at: string
          decided_by: string
          decision: string
          evidence: Json
          facts: Json
          id: string
          meeting_id: string
          rationale: string | null
          recommendations: Json
          title: string
        }
        Insert: {
          agenda_item_id?: string | null
          confidence?: number
          created_at?: string
          decided_by: string
          decision: string
          evidence?: Json
          facts?: Json
          id?: string
          meeting_id: string
          rationale?: string | null
          recommendations?: Json
          title: string
        }
        Update: {
          agenda_item_id?: string | null
          confidence?: number
          created_at?: string
          decided_by?: string
          decision?: string
          evidence?: Json
          facts?: Json
          id?: string
          meeting_id?: string
          rationale?: string | null
          recommendations?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_decisions_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "meeting_agenda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_decisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          authored_by: string
          content: Json
          created_at: string
          id: string
          meeting_id: string
          status: string
          summary: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          authored_by: string
          content: Json
          created_at?: string
          id?: string
          meeting_id: string
          status?: string
          summary?: string | null
          version: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          authored_by?: string
          content?: Json
          created_at?: string
          id?: string
          meeting_id?: string
          status?: string
          summary?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          attendance_status: string
          created_at: string
          display_name: string | null
          external_email: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          meeting_id: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attendance_status?: string
          created_at?: string
          display_name?: string | null
          external_email?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attendance_status?: string
          created_at?: string
          display_name?: string | null
          external_email?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          company_id: string | null
          created_at: string
          description: string | null
          host_id: string
          id: string
          join_url: string | null
          linked_presentation_session_id: string | null
          location: string | null
          meeting_type: string
          metadata: Json
          scheduled_end: string
          scheduled_start: string
          status: string
          title: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          host_id: string
          id?: string
          join_url?: string | null
          linked_presentation_session_id?: string | null
          location?: string | null
          meeting_type: string
          metadata?: Json
          scheduled_end: string
          scheduled_start: string
          status?: string
          title: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          host_id?: string
          id?: string
          join_url?: string | null
          linked_presentation_session_id?: string | null
          location?: string | null
          meeting_type?: string
          metadata?: Json
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      memory_access_log: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string | null
          id: string
          memory_id: string | null
          metadata: Json
          occurred_at: string
          reason: string | null
          runtime: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id?: string | null
          id?: string
          memory_id?: string | null
          metadata?: Json
          occurred_at?: string
          reason?: string | null
          runtime?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string | null
          id?: string
          memory_id?: string | null
          metadata?: Json
          occurred_at?: string
          reason?: string | null
          runtime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_access_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_access_log_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_events: {
        Row: {
          actor_id: string | null
          category: string | null
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          scope: string
          severity: string
          summary: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          actor_id?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          scope?: string
          severity?: string
          summary: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          actor_id?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          scope?: string
          severity?: string
          summary?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_items: {
        Row: {
          access_count: number
          archived: boolean
          body: string
          company_id: string | null
          created_at: string
          embedding: Json | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          importance: number
          kind: string
          last_accessed_at: string | null
          metadata: Json
          pinned: boolean
          scope: string
          search_tsv: unknown
          sensitivity: string
          source: string | null
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          access_count?: number
          archived?: boolean
          body?: string
          company_id?: string | null
          created_at?: string
          embedding?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          importance?: number
          kind: string
          last_accessed_at?: string | null
          metadata?: Json
          pinned?: boolean
          scope: string
          search_tsv?: unknown
          sensitivity?: string
          source?: string | null
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          access_count?: number
          archived?: boolean
          body?: string
          company_id?: string | null
          created_at?: string
          embedding?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          importance?: number
          kind?: string
          last_accessed_at?: string | null
          metadata?: Json
          pinned?: boolean
          scope?: string
          search_tsv?: unknown
          sensitivity?: string
          source?: string | null
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_links: {
        Row: {
          created_at: string
          created_by: string | null
          from_memory_id: string
          id: string
          link_kind: string
          to_memory_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_memory_id: string
          id?: string
          link_kind?: string
          to_memory_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_memory_id?: string
          id?: string
          link_kind?: string
          to_memory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_links_from_memory_id_fkey"
            columns: ["from_memory_id"]
            isOneToOne: false
            referencedRelation: "memory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_links_to_memory_id_fkey"
            columns: ["to_memory_id"]
            isOneToOne: false
            referencedRelation: "memory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_retention_policies: {
        Row: {
          active: boolean
          archive_after_days: number | null
          company_id: string | null
          created_at: string
          created_by: string | null
          hard_delete: boolean
          id: string
          kind: string
          max_age_days: number | null
          max_items: number | null
          scope: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          archive_after_days?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          hard_delete?: boolean
          id?: string
          kind: string
          max_age_days?: number | null
          max_items?: number | null
          scope: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          archive_after_days?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          hard_delete?: boolean
          id?: string
          kind?: string
          max_age_days?: number | null
          max_items?: number | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_retention_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_events: {
        Row: {
          created_at: string
          id: string
          labels: Json
          metric: string
          occurred_at: string
          service: string
          unit: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          labels?: Json
          metric: string
          occurred_at?: string
          service: string
          unit?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          labels?: Json
          metric?: string
          occurred_at?: string
          service?: string
          unit?: string | null
          value?: number
        }
        Relationships: []
      }
      mfg_product_kinds: {
        Row: {
          company_id: string
          created_at: string
          kind: string
          product_id: string
          shelf_life_days: number | null
          uom: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          kind: string
          product_id: string
          shelf_life_days?: number | null
          uom?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          kind?: string
          product_id?: string
          shelf_life_days?: number | null
          uom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfg_product_kinds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mfg_product_kinds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          enabled: boolean
          id: string
          kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          enabled?: boolean
          id?: string
          kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          company_id: string | null
          created_at: string
          delivered_at: string | null
          id: string
          kind: string
          payload: Json
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          company_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          company_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_log_entries: {
        Row: {
          actor_id: string | null
          attributes: Json
          company_id: string | null
          correlation_id: string | null
          created_at: string
          id: string
          level: string
          message: string
          occurred_at: string
          service: string
          trace_id: string | null
        }
        Insert: {
          actor_id?: string | null
          attributes?: Json
          company_id?: string | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          level?: string
          message: string
          occurred_at?: string
          service: string
          trace_id?: string | null
        }
        Update: {
          actor_id?: string | null
          attributes?: Json
          company_id?: string | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          occurred_at?: string
          service?: string
          trace_id?: string | null
        }
        Relationships: []
      }
      obs_status_components: {
        Row: {
          created_at: string
          description: string | null
          group_name: string | null
          id: string
          is_public: boolean
          key: string
          name: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_name?: string | null
          id?: string
          is_public?: boolean
          key: string
          name: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_name?: string | null
          id?: string
          is_public?: boolean
          key?: string
          name?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      obs_status_updates: {
        Row: {
          actor_id: string | null
          component_key: string
          created_at: string
          id: string
          incident_id: string | null
          message: string
          occurred_at: string
          status: string
        }
        Insert: {
          actor_id?: string | null
          component_key: string
          created_at?: string
          id?: string
          incident_id?: string | null
          message: string
          occurred_at?: string
          status: string
        }
        Update: {
          actor_id?: string | null
          component_key?: string
          created_at?: string
          id?: string
          incident_id?: string | null
          message?: string
          occurred_at?: string
          status?: string
        }
        Relationships: []
      }
      obs_trace_spans: {
        Row: {
          actor_id: string | null
          attributes: Json
          company_id: string | null
          created_at: string
          duration_ms: number | null
          id: string
          operation: string
          parent_span_id: string | null
          service: string
          span_id: string
          started_at: string
          status: string
          trace_id: string
        }
        Insert: {
          actor_id?: string | null
          attributes?: Json
          company_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          operation: string
          parent_span_id?: string | null
          service: string
          span_id: string
          started_at?: string
          status?: string
          trace_id: string
        }
        Update: {
          actor_id?: string | null
          attributes?: Json
          company_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          operation?: string
          parent_span_id?: string | null
          service?: string
          span_id?: string
          started_at?: string
          status?: string
          trace_id?: string
        }
        Relationships: []
      }
      offices: {
        Row: {
          address: Json
          brand_id: string | null
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          id: string
          kind: string
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          address?: Json
          brand_id?: string | null
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          id?: string
          kind?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          address?: Json
          brand_id?: string | null
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          attempts: number
          business_result: Json
          canonical_type: string | null
          correlation_id: string
          error_reason: string | null
          event_type: string
          http_status: number
          id: string
          last_error: string | null
          latency_ms: number
          metadata: Json
          next_attempt_at: string | null
          payload_digest: string | null
          process_status: Database["public"]["Enums"]["webhook_process_status"]
          processed_at: string | null
          provider: Database["public"]["Enums"]["payment_provider_code"]
          provider_event_id: string | null
          received_at: string
          signature_present: boolean
          timestamp_present: boolean
          verify_result: Database["public"]["Enums"]["webhook_verify_result"]
        }
        Insert: {
          attempts?: number
          business_result?: Json
          canonical_type?: string | null
          correlation_id?: string
          error_reason?: string | null
          event_type: string
          http_status: number
          id?: string
          last_error?: string | null
          latency_ms?: number
          metadata?: Json
          next_attempt_at?: string | null
          payload_digest?: string | null
          process_status?: Database["public"]["Enums"]["webhook_process_status"]
          processed_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider_code"]
          provider_event_id?: string | null
          received_at?: string
          signature_present?: boolean
          timestamp_present?: boolean
          verify_result: Database["public"]["Enums"]["webhook_verify_result"]
        }
        Update: {
          attempts?: number
          business_result?: Json
          canonical_type?: string | null
          correlation_id?: string
          error_reason?: string | null
          event_type?: string
          http_status?: number
          id?: string
          last_error?: string | null
          latency_ms?: number
          metadata?: Json
          next_attempt_at?: string | null
          payload_digest?: string | null
          process_status?: Database["public"]["Enums"]["webhook_process_status"]
          processed_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider_code"]
          provider_event_id?: string | null
          received_at?: string
          signature_present?: boolean
          timestamp_present?: boolean
          verify_result?: Database["public"]["Enums"]["webhook_verify_result"]
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          company_id: string
          created_at: string
          currency: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          provider: string | null
          provider_ref: string | null
          received_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          company_id: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          provider?: string | null
          provider_ref?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          company_id?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          provider?: string | null
          provider_ref?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          id: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description: string
          id?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          code: string
          created_at: string
          credits_included: number
          currency: string
          features: Json
          id: string
          is_active: boolean
          metadata: Json
          name: string
          price_cents: number
          seats_included: number
          sort_order: number
          tier: Database["public"]["Enums"]["plan_tier"]
          trial_days: number
          updated_at: string
        }
        Insert: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          code: string
          created_at?: string
          credits_included?: number
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          price_cents?: number
          seats_included?: number
          sort_order?: number
          tier?: Database["public"]["Enums"]["plan_tier"]
          trial_days?: number
          updated_at?: string
        }
        Update: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          code?: string
          created_at?: string
          credits_included?: number
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          price_cents?: number
          seats_included?: number
          sort_order?: number
          tier?: Database["public"]["Enums"]["plan_tier"]
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      plugin_analytics_daily: {
        Row: {
          avg_latency_ms: number
          company_id: string
          created_at: string
          day: string
          errors: number
          id: string
          installation_id: string
          invocations: number
          metadata: Json
          p95_latency_ms: number
          plugin_id: string
          unique_users: number
          updated_at: string
        }
        Insert: {
          avg_latency_ms?: number
          company_id: string
          created_at?: string
          day: string
          errors?: number
          id?: string
          installation_id: string
          invocations?: number
          metadata?: Json
          p95_latency_ms?: number
          plugin_id: string
          unique_users?: number
          updated_at?: string
        }
        Update: {
          avg_latency_ms?: number
          company_id?: string
          created_at?: string
          day?: string
          errors?: number
          id?: string
          installation_id?: string
          invocations?: number
          metadata?: Json
          p95_latency_ms?: number
          plugin_id?: string
          unique_users?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_analytics_daily_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_analytics_daily_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "plugin_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_analytics_daily_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_events: {
        Row: {
          actor_id: string | null
          company_id: string | null
          created_at: string
          event_type: string
          id: string
          installation_id: string | null
          message: string | null
          metadata: Json
          plugin_id: string | null
          plugin_version_id: string | null
          severity: string
        }
        Insert: {
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          installation_id?: string | null
          message?: string | null
          metadata?: Json
          plugin_id?: string | null
          plugin_version_id?: string | null
          severity?: string
        }
        Update: {
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          installation_id?: string | null
          message?: string | null
          metadata?: Json
          plugin_id?: string | null
          plugin_version_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_events_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "plugin_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_events_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_events_plugin_version_id_fkey"
            columns: ["plugin_version_id"]
            isOneToOne: false
            referencedRelation: "plugin_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_grants: {
        Row: {
          created_at: string
          id: string
          optional: boolean
          permission_code: string
          plugin_version_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          optional?: boolean
          permission_code: string
          plugin_version_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          optional?: boolean
          permission_code?: string
          plugin_version_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_grants_plugin_version_id_fkey"
            columns: ["plugin_version_id"]
            isOneToOne: false
            referencedRelation: "plugin_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_installations: {
        Row: {
          company_id: string
          config: Json
          enabled: boolean
          granted_permissions: string[]
          id: string
          installed_at: string
          installed_by: string | null
          plugin_id: string
          plugin_version_id: string
          previous_version_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          config?: Json
          enabled?: boolean
          granted_permissions?: string[]
          id?: string
          installed_at?: string
          installed_by?: string | null
          plugin_id: string
          plugin_version_id: string
          previous_version_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json
          enabled?: boolean
          granted_permissions?: string[]
          id?: string
          installed_at?: string
          installed_by?: string | null
          plugin_id?: string
          plugin_version_id?: string
          previous_version_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_installations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_installations_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_installations_plugin_version_id_fkey"
            columns: ["plugin_version_id"]
            isOneToOne: false
            referencedRelation: "plugin_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_installations_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "plugin_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          label: string
          requires_founder_approval: boolean
          risk_level: string
          scope: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          requires_founder_approval?: boolean
          risk_level?: string
          scope?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          requires_founder_approval?: boolean
          risk_level?: string
          scope?: string
        }
        Relationships: []
      }
      plugin_versions: {
        Row: {
          changelog: string | null
          checksum: string
          created_at: string
          deprecated: boolean
          entry_point: string | null
          id: string
          manifest: Json
          min_platform_version: string | null
          plugin_id: string
          published_at: string | null
          published_by: string | null
          runtime: string
          version: string
        }
        Insert: {
          changelog?: string | null
          checksum: string
          created_at?: string
          deprecated?: boolean
          entry_point?: string | null
          id?: string
          manifest: Json
          min_platform_version?: string | null
          plugin_id: string
          published_at?: string | null
          published_by?: string | null
          runtime?: string
          version: string
        }
        Update: {
          changelog?: string | null
          checksum?: string
          created_at?: string
          deprecated?: boolean
          entry_point?: string | null
          id?: string
          manifest?: Json
          min_platform_version?: string | null
          plugin_id?: string
          published_at?: string | null
          published_by?: string | null
          runtime?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_versions_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          homepage_url: string | null
          icon_url: string | null
          id: string
          latest_version_id: string | null
          name: string
          publisher: string
          publisher_url: string | null
          slug: string
          status: string
          tags: string[]
          updated_at: string
          verified: boolean
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          homepage_url?: string | null
          icon_url?: string | null
          id?: string
          latest_version_id?: string | null
          name: string
          publisher: string
          publisher_url?: string | null
          slug: string
          status?: string
          tags?: string[]
          updated_at?: string
          verified?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          homepage_url?: string | null
          icon_url?: string | null
          id?: string
          latest_version_id?: string | null
          name?: string
          publisher?: string
          publisher_url?: string | null
          slug?: string
          status?: string
          tags?: string[]
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "plugins_latest_version_fk"
            columns: ["latest_version_id"]
            isOneToOne: false
            referencedRelation: "plugin_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          company_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          group_id: string | null
          id: string
          media: Json
          reaction_count: number
          reply_count: number
          status: Database["public"]["Enums"]["record_status"]
          title: string | null
          updated_at: string
          updated_by: string | null
          version: number
          visibility: string
        }
        Insert: {
          author_id: string
          body: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          group_id?: string | null
          id?: string
          media?: Json
          reaction_count?: number
          reply_count?: number
          status?: Database["public"]["Enums"]["record_status"]
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          visibility?: string
        }
        Update: {
          author_id?: string
          body?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          group_id?: string | null
          id?: string
          media?: Json
          reaction_count?: number
          reply_count?: number
          status?: Database["public"]["Enums"]["record_status"]
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_analytics: {
        Row: {
          annotation_count: number
          answer_count: number
          company_id: string | null
          completion_rate: number
          created_at: string
          duration_ms: number
          id: string
          interaction_rate: number
          pointer_count: number
          presenter_id: string
          question_count: number
          session_id: string
          slides_shown: number
          slides_total: number
          teaching_effectiveness: number
          whiteboard_command_count: number
          window_end: string
          window_start: string
        }
        Insert: {
          annotation_count?: number
          answer_count?: number
          company_id?: string | null
          completion_rate?: number
          created_at?: string
          duration_ms?: number
          id?: string
          interaction_rate?: number
          pointer_count?: number
          presenter_id: string
          question_count?: number
          session_id: string
          slides_shown?: number
          slides_total?: number
          teaching_effectiveness?: number
          whiteboard_command_count?: number
          window_end: string
          window_start: string
        }
        Update: {
          annotation_count?: number
          answer_count?: number
          company_id?: string | null
          completion_rate?: number
          created_at?: string
          duration_ms?: number
          id?: string
          interaction_rate?: number
          pointer_count?: number
          presenter_id?: string
          question_count?: number
          session_id?: string
          slides_shown?: number
          slides_total?: number
          teaching_effectiveness?: number
          whiteboard_command_count?: number
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "presentation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_annotation_versions: {
        Row: {
          annotation_id: string
          body: string
          change_reason: string | null
          created_at: string
          editor_id: string
          id: string
          kind: string
          region: Json
          resolved: boolean
          version: number
        }
        Insert: {
          annotation_id: string
          body: string
          change_reason?: string | null
          created_at?: string
          editor_id: string
          id?: string
          kind: string
          region?: Json
          resolved?: boolean
          version: number
        }
        Update: {
          annotation_id?: string
          body?: string
          change_reason?: string | null
          created_at?: string
          editor_id?: string
          id?: string
          kind?: string
          region?: Json
          resolved?: boolean
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentation_annotation_versions_annotation_id_fkey"
            columns: ["annotation_id"]
            isOneToOne: false
            referencedRelation: "presentation_annotations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_annotations: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          kind: string
          region: Json
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          session_id: string
          slide_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          kind?: string
          region?: Json
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          session_id: string
          slide_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          kind?: string
          region?: Json
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string
          slide_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentation_annotations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "presentation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_annotations_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "presentation_slides"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_commands: {
        Row: {
          channel: string
          command: string
          created_at: string
          id: string
          issuer_id: string
          payload: Json
          sequence: number
          session_id: string
          target_slide_id: string | null
        }
        Insert: {
          channel: string
          command: string
          created_at?: string
          id?: string
          issuer_id: string
          payload?: Json
          sequence?: number
          session_id: string
          target_slide_id?: string | null
        }
        Update: {
          channel?: string
          command?: string
          created_at?: string
          id?: string
          issuer_id?: string
          payload?: Json
          sequence?: number
          session_id?: string
          target_slide_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_commands_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "presentation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_sessions: {
        Row: {
          archived_at: string | null
          company_id: string | null
          created_at: string
          current_slide_id: string | null
          description: string | null
          ended_at: string | null
          happy_session_id: string | null
          id: string
          meta: Json
          mode: string
          participants: Json
          paused_at: string | null
          presentation_type: string
          presenter_id: string
          resumed_at: string | null
          scheduled_at: string | null
          started_at: string | null
          state: string
          title: string
          updated_at: string
          voice_session_id: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id?: string | null
          created_at?: string
          current_slide_id?: string | null
          description?: string | null
          ended_at?: string | null
          happy_session_id?: string | null
          id?: string
          meta?: Json
          mode?: string
          participants?: Json
          paused_at?: string | null
          presentation_type: string
          presenter_id: string
          resumed_at?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          state?: string
          title: string
          updated_at?: string
          voice_session_id?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string | null
          created_at?: string
          current_slide_id?: string | null
          description?: string | null
          ended_at?: string | null
          happy_session_id?: string | null
          id?: string
          meta?: Json
          mode?: string
          participants?: Json
          paused_at?: string | null
          presentation_type?: string
          presenter_id?: string
          resumed_at?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          state?: string
          title?: string
          updated_at?: string
          voice_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_presentation_sessions_current_slide"
            columns: ["current_slide_id"]
            isOneToOne: false
            referencedRelation: "presentation_slides"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_slides: {
        Row: {
          body: string | null
          chapter: string | null
          created_at: string
          id: string
          kind: string
          meta: Json
          narration: string | null
          reference_id: string | null
          reference_type: string | null
          scene_index: number
          session_id: string
          slide_index: number
          title: string
          transition: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          chapter?: string | null
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          narration?: string | null
          reference_id?: string | null
          reference_type?: string | null
          scene_index?: number
          session_id: string
          slide_index: number
          title: string
          transition?: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          chapter?: string | null
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          narration?: string | null
          reference_id?: string | null
          reference_type?: string | null
          scene_index?: number
          session_id?: string
          slide_index?: number
          title?: string
          transition?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_slides_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "presentation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          parent_id: string | null
          position: number
          slug: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batches: {
        Row: {
          batch_number: string
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          manufactured_at: string
          notes: string | null
          product_id: string
          production_order_id: string | null
          quality_status: string
          quantity: number
          traceability: Json
          updated_at: string
        }
        Insert: {
          batch_number: string
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          manufactured_at?: string
          notes?: string | null
          product_id: string
          production_order_id?: string | null
          quality_status?: string
          quantity?: number
          traceability?: Json
          updated_at?: string
        }
        Update: {
          batch_number?: string
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          manufactured_at?: string
          notes?: string | null
          product_id?: string
          production_order_id?: string | null
          quality_status?: string
          quantity?: number
          traceability?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          bom_id: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          machine_id: string | null
          notes: string | null
          number: string
          operator_id: string | null
          planned_quantity: number
          produced_quantity: number
          product_id: string
          scheduled_end: string | null
          scheduled_start: string | null
          started_at: string | null
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          bom_id?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          number: string
          operator_id?: string | null
          planned_quantity?: number
          produced_quantity?: number
          product_id: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          bom_id?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          number?: string
          operator_id?: string | null
          planned_quantity?: number
          produced_quantity?: number
          product_id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bill_of_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json
          brand_id: string | null
          category_id: string | null
          company_id: string
          cost_cents: number
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          description: string | null
          id: string
          is_service: boolean
          name: string
          price_cents: number
          sku: string | null
          status: Database["public"]["Enums"]["record_status"]
          tax_rate_id: string | null
          updated_at: string
          updated_by: string | null
          version: number
          weight_grams: number | null
        }
        Insert: {
          attributes?: Json
          brand_id?: string | null
          category_id?: string | null
          company_id: string
          cost_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_service?: boolean
          name: string
          price_cents?: number
          sku?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tax_rate_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          weight_grams?: number | null
        }
        Update: {
          attributes?: Json
          brand_id?: string | null
          category_id?: string | null
          company_id?: string
          cost_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_service?: boolean
          name?: string
          price_cents?: number
          sku?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tax_rate_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_tax"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_deployment_events: {
        Row: {
          created_at: string
          deployment_id: string
          id: string
          level: string
          message: string
          metadata: Json
          step: string
        }
        Insert: {
          created_at?: string
          deployment_id: string
          id?: string
          level?: string
          message: string
          metadata?: Json
          step: string
        }
        Update: {
          created_at?: string
          deployment_id?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_deployment_events_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "project_deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_deployments: {
        Row: {
          artifact_bytes: number | null
          artifact_path: string | null
          build_profile: Json
          cancelled_at: string | null
          created_at: string
          deployed_url: string | null
          duration_ms: number | null
          environment: Database["public"]["Enums"]["project_deployment_env"]
          error_message: string | null
          finished_at: string | null
          id: string
          metadata: Json
          project_id: string
          release_notes: string | null
          rolled_back_from: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["project_deployment_state"]
          target: Database["public"]["Enums"]["project_deployment_target"]
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          artifact_bytes?: number | null
          artifact_path?: string | null
          build_profile?: Json
          cancelled_at?: string | null
          created_at?: string
          deployed_url?: string | null
          duration_ms?: number | null
          environment?: Database["public"]["Enums"]["project_deployment_env"]
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          project_id: string
          release_notes?: string | null
          rolled_back_from?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_deployment_state"]
          target?: Database["public"]["Enums"]["project_deployment_target"]
          updated_at?: string
          user_id: string
          version?: string
        }
        Update: {
          artifact_bytes?: number | null
          artifact_path?: string | null
          build_profile?: Json
          cancelled_at?: string | null
          created_at?: string
          deployed_url?: string | null
          duration_ms?: number | null
          environment?: Database["public"]["Enums"]["project_deployment_env"]
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          project_id?: string
          release_notes?: string | null
          rolled_back_from?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_deployment_state"]
          target?: Database["public"]["Enums"]["project_deployment_target"]
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "creator_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deployments_rolled_back_from_fkey"
            columns: ["rolled_back_from"]
            isOneToOne: false
            referencedRelation: "project_deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_domain_certificates: {
        Row: {
          created_at: string
          domain_id: string
          expires_at: string | null
          fingerprint: string | null
          id: string
          issued_at: string | null
          issuer: string | null
          metadata: Json
          renewed_from: string | null
          serial: string | null
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain_id: string
          expires_at?: string | null
          fingerprint?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          metadata?: Json
          renewed_from?: string | null
          serial?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain_id?: string
          expires_at?: string | null
          fingerprint?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          metadata?: Json
          renewed_from?: string | null
          serial?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_domain_certificates_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "project_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_domain_certificates_renewed_from_fkey"
            columns: ["renewed_from"]
            isOneToOne: false
            referencedRelation: "project_domain_certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_domain_events: {
        Row: {
          created_at: string
          domain_id: string
          event_type: string
          id: string
          level: string
          message: string | null
          metadata: Json
        }
        Insert: {
          created_at?: string
          domain_id: string
          event_type: string
          id?: string
          level?: string
          message?: string | null
          metadata?: Json
        }
        Update: {
          created_at?: string
          domain_id?: string
          event_type?: string
          id?: string
          level?: string
          message?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "project_domain_events_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "project_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      project_domains: {
        Row: {
          created_at: string
          dns_records: Json
          dns_status: string
          hostname: string
          id: string
          is_primary: boolean
          last_checked_at: string | null
          metadata: Json
          project_id: string
          redirect_rules: Json
          ssl_expires_at: string | null
          ssl_issued_at: string | null
          ssl_issuer: string | null
          ssl_last_error: string | null
          ssl_serial: string | null
          ssl_state: string
          ssl_status: string
          status: string
          updated_at: string
          user_id: string
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          dns_records?: Json
          dns_status?: string
          hostname: string
          id?: string
          is_primary?: boolean
          last_checked_at?: string | null
          metadata?: Json
          project_id: string
          redirect_rules?: Json
          ssl_expires_at?: string | null
          ssl_issued_at?: string | null
          ssl_issuer?: string | null
          ssl_last_error?: string | null
          ssl_serial?: string | null
          ssl_state?: string
          ssl_status?: string
          status?: string
          updated_at?: string
          user_id: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          dns_records?: Json
          dns_status?: string
          hostname?: string
          id?: string
          is_primary?: boolean
          last_checked_at?: string | null
          metadata?: Json
          project_id?: string
          redirect_rules?: Json
          ssl_expires_at?: string | null
          ssl_issued_at?: string | null
          ssl_issuer?: string | null
          ssl_last_error?: string | null
          ssl_serial?: string | null
          ssl_state?: string
          ssl_status?: string
          status?: string
          updated_at?: string
          user_id?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_domains_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "creator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          product_id: string | null
          purchase_order_id: string
          quantity: number
          total_cents: number
          unit_cost_cents: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          purchase_order_id: string
          quantity?: number
          total_cents?: number
          unit_cost_cents?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          purchase_order_id?: string
          quantity?: number
          total_cents?: number
          unit_cost_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approval_status: string
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          id: string
          notes: string | null
          number: string
          ordered_at: string | null
          received_at: string | null
          status: Database["public"]["Enums"]["record_status"]
          subtotal_cents: number
          supplier_id: string | null
          tax_cents: number
          total_cents: number
          updated_at: string
          updated_by: string | null
          version: number
          warehouse_id: string | null
        }
        Insert: {
          approval_status?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          number: string
          ordered_at?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          subtotal_cents?: number
          supplier_id?: string | null
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          warehouse_id?: string | null
        }
        Update: {
          approval_status?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          number?: string
          ordered_at?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          subtotal_cents?: number
          supplier_id?: string | null
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_request_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          request_id: string
          total_cents: number
          unit_cost_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          request_id: string
          total_cents?: number
          unit_cost_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          request_id?: string
          total_cents?: number
          unit_cost_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          branch_id: string | null
          company_id: string
          created_at: string
          currency: string
          department_id: string | null
          id: string
          justification: string | null
          metadata: Json
          needed_by: string | null
          number: string
          requested_by: string | null
          status: string
          title: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          company_id: string
          created_at?: string
          currency?: string
          department_id?: string | null
          id?: string
          justification?: string | null
          metadata?: Json
          needed_by?: string | null
          number: string
          requested_by?: string | null
          status?: string
          title: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          department_id?: string | null
          id?: string
          justification?: string | null
          metadata?: Json
          needed_by?: string | null
          number?: string
          requested_by?: string | null
          status?: string
          title?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_inspections: {
        Row: {
          batch_id: string | null
          company_id: string
          created_at: string
          criteria: Json
          id: string
          inspected_at: string
          inspector_id: string | null
          notes: string | null
          production_order_id: string | null
          result: string
        }
        Insert: {
          batch_id?: string | null
          company_id: string
          created_at?: string
          criteria?: Json
          id?: string
          inspected_at?: string
          inspector_id?: string | null
          notes?: string | null
          production_order_id?: string | null
          result: string
        }
        Update: {
          batch_id?: string | null
          company_id?: string
          created_at?: string
          criteria?: Json
          id?: string
          inspected_at?: string
          inspector_id?: string | null
          notes?: string | null
          production_order_id?: string | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_inspections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          choices: Json
          correct: Json
          created_at: string
          explanation: string | null
          id: string
          kind: string
          points: number
          position: number
          prompt: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          choices?: Json
          correct?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          kind?: string
          points?: number
          position?: number
          prompt: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          choices?: Json
          correct?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          kind?: string
          points?: number
          position?: number
          prompt?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          company_id: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          lesson_id: string | null
          passing_score: number
          status: Database["public"]["Enums"]["record_status"]
          time_limit_seconds: number | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          company_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          lesson_id?: string | null
          passing_score?: number
          status?: Database["public"]["Enums"]["record_status"]
          time_limit_seconds?: number | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          company_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          lesson_id?: string | null
          passing_score?: number
          status?: Database["public"]["Enums"]["record_status"]
          time_limit_seconds?: number | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          kind: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      receptionist_analytics_snapshots: {
        Row: {
          appointment_conversions: number
          avg_confidence: number
          avg_latency_ms: number
          company_id: string | null
          computed_by: string | null
          created_at: string
          domain_distribution: Json
          id: string
          languages: Json
          lead_conversions: number
          mode_distribution: Json
          ticket_conversions: number
          total_sessions: number
          total_turns: number
          window_end: string
          window_start: string
        }
        Insert: {
          appointment_conversions?: number
          avg_confidence?: number
          avg_latency_ms?: number
          company_id?: string | null
          computed_by?: string | null
          created_at?: string
          domain_distribution?: Json
          id?: string
          languages?: Json
          lead_conversions?: number
          mode_distribution?: Json
          ticket_conversions?: number
          total_sessions?: number
          total_turns?: number
          window_end: string
          window_start: string
        }
        Update: {
          appointment_conversions?: number
          avg_confidence?: number
          avg_latency_ms?: number
          company_id?: string | null
          computed_by?: string | null
          created_at?: string
          domain_distribution?: Json
          id?: string
          languages?: Json
          lead_conversions?: number
          mode_distribution?: Json
          ticket_conversions?: number
          total_sessions?: number
          total_turns?: number
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      receptionist_sessions: {
        Row: {
          channel: string
          company_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          is_returning: boolean
          language: string
          last_activity_at: string
          metadata: Json
          mode: string
          started_at: string
          status: string
          updated_at: string
          user_id: string | null
          visitor_key: string
        }
        Insert: {
          channel?: string
          company_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          is_returning?: boolean
          language?: string
          last_activity_at?: string
          metadata?: Json
          mode?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_key: string
        }
        Update: {
          channel?: string
          company_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          is_returning?: boolean
          language?: string
          last_activity_at?: string
          metadata?: Json
          mode?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_key?: string
        }
        Relationships: []
      }
      receptionist_turns: {
        Row: {
          company_id: string | null
          confidence: number
          created_at: string
          domain: string
          facts: Json
          id: string
          input: Json
          intent: string
          latency_ms: number | null
          mode: string
          outcome: Json
          recommendations: Json
          routed_runtime: string
          seq: number
          session_id: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          confidence?: number
          created_at?: string
          domain: string
          facts?: Json
          id?: string
          input?: Json
          intent: string
          latency_ms?: number | null
          mode: string
          outcome?: Json
          recommendations?: Json
          routed_runtime: string
          seq: number
          session_id: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          confidence?: number
          created_at?: string
          domain?: string
          facts?: Json
          id?: string
          input?: Json
          intent?: string
          latency_ms?: number | null
          mode?: string
          outcome?: Json
          recommendations?: Json
          routed_runtime?: string
          seq?: number
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receptionist_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "receptionist_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      release_artifacts: {
        Row: {
          artifact_id: string | null
          created_at: string
          created_by: string
          filename: string
          id: string
          kind: string
          metadata: Json
          release_id: string
          sbom: Json
          sha256: string | null
          signed: boolean
          signing_identity: string | null
          size_bytes: number
          storage_url: string | null
        }
        Insert: {
          artifact_id?: string | null
          created_at?: string
          created_by?: string
          filename: string
          id?: string
          kind: string
          metadata?: Json
          release_id: string
          sbom?: Json
          sha256?: string | null
          signed?: boolean
          signing_identity?: string | null
          size_bytes?: number
          storage_url?: string | null
        }
        Update: {
          artifact_id?: string | null
          created_at?: string
          created_by?: string
          filename?: string
          id?: string
          kind?: string
          metadata?: Json
          release_id?: string
          sbom?: Json
          sha256?: string | null
          signed?: boolean
          signing_identity?: string | null
          size_bytes?: number
          storage_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "release_artifacts_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "deploy_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_artifacts_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "release_records"
            referencedColumns: ["id"]
          },
        ]
      }
      release_changelog_entries: {
        Row: {
          authored_by: string
          category: string
          created_at: string
          detail: string | null
          id: string
          reference_url: string | null
          release_id: string
          summary: string
        }
        Insert: {
          authored_by?: string
          category: string
          created_at?: string
          detail?: string | null
          id?: string
          reference_url?: string | null
          release_id: string
          summary: string
        }
        Update: {
          authored_by?: string
          category?: string
          created_at?: string
          detail?: string | null
          id?: string
          reference_url?: string | null
          release_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_changelog_entries_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "release_records"
            referencedColumns: ["id"]
          },
        ]
      }
      release_crash_symbols: {
        Row: {
          external_url: string | null
          filename: string
          id: string
          platform_code: string
          release_id: string
          sha256: string
          size_bytes: number
          symbol_type: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          external_url?: string | null
          filename: string
          id?: string
          platform_code: string
          release_id: string
          sha256: string
          size_bytes?: number
          symbol_type: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Update: {
          external_url?: string | null
          filename?: string
          id?: string
          platform_code?: string
          release_id?: string
          sha256?: string
          size_bytes?: number
          symbol_type?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_crash_symbols_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "release_records"
            referencedColumns: ["id"]
          },
        ]
      }
      release_records: {
        Row: {
          certification_id: string | null
          channel: string
          compatibility: Json
          created_at: string
          id: string
          release_notes: string | null
          released_at: string | null
          released_by: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          certification_id?: string | null
          channel?: string
          compatibility?: Json
          created_at?: string
          id?: string
          release_notes?: string | null
          released_at?: string | null
          released_by: string
          status?: string
          updated_at?: string
          version: string
        }
        Update: {
          certification_id?: string | null
          channel?: string
          compatibility?: Json
          created_at?: string
          id?: string
          release_notes?: string | null
          released_at?: string | null
          released_by?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_records_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certification_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      release_rollbacks: {
        Row: {
          approved_by: string | null
          completed_at: string | null
          created_at: string
          from_release_id: string
          id: string
          initiated_by: string
          metadata: Json
          reason: string
          severity: string
          status: string
          stores_affected: Json
          to_release_id: string
        }
        Insert: {
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          from_release_id: string
          id?: string
          initiated_by?: string
          metadata?: Json
          reason: string
          severity?: string
          status?: string
          stores_affected?: Json
          to_release_id: string
        }
        Update: {
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          from_release_id?: string
          id?: string
          initiated_by?: string
          metadata?: Json
          reason?: string
          severity?: string
          status?: string
          stores_affected?: Json
          to_release_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_rollbacks_from_release_id_fkey"
            columns: ["from_release_id"]
            isOneToOne: false
            referencedRelation: "release_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_rollbacks_to_release_id_fkey"
            columns: ["to_release_id"]
            isOneToOne: false
            referencedRelation: "release_records"
            referencedColumns: ["id"]
          },
        ]
      }
      release_signing_profiles: {
        Row: {
          created_at: string
          env_var_name: string | null
          fingerprint: string | null
          id: string
          identity_hint: string | null
          is_active: boolean
          key_source: string
          platform_code: string
          profile_name: string
          rotated_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          env_var_name?: string | null
          fingerprint?: string | null
          id?: string
          identity_hint?: string | null
          is_active?: boolean
          key_source?: string
          platform_code: string
          profile_name: string
          rotated_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          env_var_name?: string | null
          fingerprint?: string | null
          id?: string
          identity_hint?: string | null
          is_active?: boolean
          key_source?: string
          platform_code?: string
          profile_name?: string
          rotated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      release_store_submissions: {
        Row: {
          created_at: string
          external_submission_id: string | null
          id: string
          missing_requirements: Json
          release_id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
          store: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
          validation_report: Json
        }
        Insert: {
          created_at?: string
          external_submission_id?: string | null
          id?: string
          missing_requirements?: Json
          release_id: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          store: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          validation_report?: Json
        }
        Update: {
          created_at?: string
          external_submission_id?: string | null
          id?: string
          missing_requirements?: Json
          release_id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          store?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          validation_report?: Json
        }
        Relationships: [
          {
            foreignKeyName: "release_store_submissions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "release_records"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_config: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "remote_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_assignments: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          role_id: string
          scope_id: string | null
          scope_type: Database["public"]["Enums"]["scope_type"]
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          role_id: string
          scope_id?: string | null
          scope_type: Database["public"]["Enums"]["scope_type"]
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          role_id?: string
          scope_id?: string | null
          scope_type?: Database["public"]["Enums"]["scope_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          metadata: Json
          name: string
          scope_type: Database["public"]["Enums"]["scope_type"]
          updated_at: string
        }
        Insert: {
          code: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          metadata?: Json
          name: string
          scope_type?: Database["public"]["Enums"]["scope_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          metadata?: Json
          name?: string
          scope_type?: Database["public"]["Enums"]["scope_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          product_id: string | null
          quantity: number
          sales_order_id: string
          total_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sales_order_id: string
          total_cents?: number
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sales_order_id?: string
          total_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          approval_status: string
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          deleted_at: string | null
          fulfilled_at: string | null
          id: string
          notes: string | null
          number: string
          ordered_at: string | null
          status: Database["public"]["Enums"]["record_status"]
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
          updated_by: string | null
          version: number
          warehouse_id: string | null
        }
        Insert: {
          approval_status?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          deleted_at?: string | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          number: string
          ordered_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          warehouse_id?: string | null
        }
        Update: {
          approval_status?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          deleted_at?: string | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          number?: string
          ordered_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_jobs: {
        Row: {
          company_id: string | null
          created_at: string
          cron: string
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          payload: Json
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          cron: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          payload?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          cron?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          payload?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          scope_id: string | null
          scope_type: Database["public"]["Enums"]["scope_type"]
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          scope_id?: string | null
          scope_type: Database["public"]["Enums"]["scope_type"]
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          scope_id?: string | null
          scope_type?: Database["public"]["Enums"]["scope_type"]
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      specialist_analytics_snapshots: {
        Row: {
          avg_confidence: number
          avg_latency_ms: number
          company_id: string | null
          computed_by: string | null
          created_at: string
          domain_distribution: Json
          evidence_coverage: number
          id: string
          mode_distribution: Json
          recommendation_count: number
          session_id: string | null
          total_sessions: number
          total_turns: number
          window_end: string
          window_start: string
        }
        Insert: {
          avg_confidence?: number
          avg_latency_ms?: number
          company_id?: string | null
          computed_by?: string | null
          created_at?: string
          domain_distribution?: Json
          evidence_coverage?: number
          id?: string
          mode_distribution?: Json
          recommendation_count?: number
          session_id?: string | null
          total_sessions?: number
          total_turns?: number
          window_end: string
          window_start: string
        }
        Update: {
          avg_confidence?: number
          avg_latency_ms?: number
          company_id?: string | null
          computed_by?: string | null
          created_at?: string
          domain_distribution?: Json
          evidence_coverage?: number
          id?: string
          mode_distribution?: Json
          recommendation_count?: number
          session_id?: string | null
          total_sessions?: number
          total_turns?: number
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_analytics_snapshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "specialist_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_mode_registry: {
        Row: {
          capabilities: Json
          code: string
          created_at: string
          description: string | null
          domain: string
          enabled: boolean
          id: string
          label: string
          min_confidence: number
          required_roles: string[]
          runtime_routes: Json
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          code: string
          created_at?: string
          description?: string | null
          domain: string
          enabled?: boolean
          id?: string
          label: string
          min_confidence?: number
          required_roles?: string[]
          runtime_routes?: Json
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          code?: string
          created_at?: string
          description?: string | null
          domain?: string
          enabled?: boolean
          id?: string
          label?: string
          min_confidence?: number
          required_roles?: string[]
          runtime_routes?: Json
          updated_at?: string
        }
        Relationships: []
      }
      specialist_sessions: {
        Row: {
          company_id: string | null
          created_at: string
          current_mode: string
          ended_at: string | null
          happy_session_id: string | null
          id: string
          language: string
          last_activity_at: string
          metadata: Json
          mode_history: Json
          previous_mode: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          current_mode: string
          ended_at?: string | null
          happy_session_id?: string | null
          id?: string
          language?: string
          last_activity_at?: string
          metadata?: Json
          mode_history?: Json
          previous_mode?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          current_mode?: string
          ended_at?: string | null
          happy_session_id?: string | null
          id?: string
          language?: string
          last_activity_at?: string
          metadata?: Json
          mode_history?: Json
          previous_mode?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      specialist_turns: {
        Row: {
          capability: string | null
          company_id: string | null
          confidence: number
          created_at: string
          domain: string
          error: string | null
          facts: Json
          id: string
          input: Json
          intent: string
          latency_ms: number | null
          mode: string
          recommendations: Json
          routed_runtime: string
          seq: number
          session_id: string
          user_id: string
        }
        Insert: {
          capability?: string | null
          company_id?: string | null
          confidence?: number
          created_at?: string
          domain: string
          error?: string | null
          facts?: Json
          id?: string
          input?: Json
          intent: string
          latency_ms?: number | null
          mode: string
          recommendations?: Json
          routed_runtime: string
          seq: number
          session_id: string
          user_id: string
        }
        Update: {
          capability?: string | null
          company_id?: string | null
          confidence?: number
          created_at?: string
          domain?: string
          error?: string | null
          facts?: Json
          id?: string
          input?: Json
          intent?: string
          latency_ms?: number | null
          mode?: string
          recommendations?: Json
          routed_runtime?: string
          seq?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "specialist_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          actor_id: string | null
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          lot_id: string | null
          metadata: Json
          product_id: string
          quantity: number
          ref_id: string | null
          ref_type: string
          released_at: string | null
          status: Database["public"]["Enums"]["wms_reservation_status"]
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          actor_id?: string | null
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          lot_id?: string | null
          metadata?: Json
          product_id: string
          quantity: number
          ref_id?: string | null
          ref_type: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["wms_reservation_status"]
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          actor_id?: string | null
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          lot_id?: string | null
          metadata?: Json
          product_id?: string
          quantity?: number
          ref_id?: string | null
          ref_type?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["wms_reservation_status"]
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          created_at: string
          from_bin_id: string | null
          id: string
          lot_id: string | null
          notes: string | null
          product_id: string
          quantity: number
          quantity_received: number
          to_bin_id: string | null
          transfer_id: string
        }
        Insert: {
          created_at?: string
          from_bin_id?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          product_id: string
          quantity: number
          quantity_received?: number
          to_bin_id?: string | null
          transfer_id: string
        }
        Update: {
          created_at?: string
          from_bin_id?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          product_id?: string
          quantity?: number
          quantity_received?: number
          to_bin_id?: string | null
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_from_bin_id_fkey"
            columns: ["from_bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_to_bin_id_fkey"
            columns: ["to_bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          from_warehouse_id: string
          id: string
          metadata: Json
          notes: string | null
          number: string
          received_at: string | null
          received_by: string | null
          shipped_at: string | null
          shipped_by: string | null
          status: Database["public"]["Enums"]["wms_transfer_status"]
          to_warehouse_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          from_warehouse_id: string
          id?: string
          metadata?: Json
          notes?: string | null
          number: string
          received_at?: string | null
          received_by?: string | null
          shipped_at?: string | null
          shipped_by?: string | null
          status?: Database["public"]["Enums"]["wms_transfer_status"]
          to_warehouse_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          from_warehouse_id?: string
          id?: string
          metadata?: Json
          notes?: string | null
          number?: string
          received_at?: string | null
          received_by?: string | null
          shipped_at?: string | null
          shipped_by?: string | null
          status?: Database["public"]["Enums"]["wms_transfer_status"]
          to_warehouse_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          label: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          label: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          label?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      store_collection_items: {
        Row: {
          collection_id: string
          id: string
          listing_id: string
          metadata: Json
          pinned_at: string
          pinned_by: string | null
          position: number
        }
        Insert: {
          collection_id: string
          id?: string
          listing_id: string
          metadata?: Json
          pinned_at?: string
          pinned_by?: string | null
          position?: number
        }
        Update: {
          collection_id?: string
          id?: string
          listing_id?: string
          metadata?: Json
          pinned_at?: string
          pinned_by?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "store_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_collection_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      store_collections: {
        Row: {
          active: boolean
          code: string
          created_at: string
          curator_id: string | null
          description: string | null
          id: string
          kind: string
          metadata: Json
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          curator_id?: string | null
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          curator_id?: string | null
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_compatibility: {
        Row: {
          conflicts: Json
          created_at: string
          created_by: string | null
          id: string
          listing_id: string
          listing_version: number
          notes: string | null
          platform_max: string | null
          platform_min: string | null
          requires: Json
        }
        Insert: {
          conflicts?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          listing_id: string
          listing_version: number
          notes?: string | null
          platform_max?: string | null
          platform_min?: string | null
          requires?: Json
        }
        Update: {
          conflicts?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          listing_id?: string
          listing_version?: number
          notes?: string | null
          platform_max?: string | null
          platform_min?: string | null
          requires?: Json
        }
        Relationships: [
          {
            foreignKeyName: "store_compatibility_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      store_events: {
        Row: {
          actor_id: string | null
          correlation_id: string | null
          created_at: string
          event_type: string
          id: string
          listing_id: string | null
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          correlation_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          listing_id?: string | null
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          correlation_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          listing_id?: string | null
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "store_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      store_featured_slots: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          listing_id: string
          metadata: Json
          slot_code: string
          starts_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          listing_id: string
          metadata?: Json
          slot_code: string
          starts_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          listing_id?: string
          metadata?: Json
          slot_code?: string
          starts_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_featured_slots_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      store_recommendations: {
        Row: {
          evidence: Json
          expires_at: string | null
          generated_at: string
          id: string
          kind: string
          listing_ids: string[]
          scope: string
          source: string
          subject_user_id: string | null
        }
        Insert: {
          evidence?: Json
          expires_at?: string | null
          generated_at?: string
          id?: string
          kind: string
          listing_ids?: string[]
          scope?: string
          source: string
          subject_user_id?: string | null
        }
        Update: {
          evidence?: Json
          expires_at?: string | null
          generated_at?: string
          id?: string
          kind?: string
          listing_ids?: string[]
          scope?: string
          source?: string
          subject_user_id?: string | null
        }
        Relationships: []
      }
      study_bookmarks: {
        Row: {
          created_at: string
          id: string
          label: string | null
          resource_id: string
          resource_type: string
          timestamp_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          resource_id: string
          resource_type: string
          timestamp_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          resource_id?: string
          resource_type?: string
          timestamp_seconds?: number | null
          user_id?: string
        }
        Relationships: []
      }
      study_flashcards: {
        Row: {
          back: string
          course_id: string | null
          created_at: string
          deck: string | null
          ease: number
          front: string
          id: string
          interval_days: number
          last_reviewed_at: string | null
          lesson_id: string | null
          next_review_at: string
          reps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          course_id?: string | null
          created_at?: string
          deck?: string | null
          ease?: number
          front: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          lesson_id?: string | null
          next_review_at?: string
          reps?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          course_id?: string | null
          created_at?: string
          deck?: string | null
          ease?: number
          front?: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          lesson_id?: string | null
          next_review_at?: string
          reps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_flashcards_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_flashcards_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      study_notes: {
        Row: {
          body: string
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          tags: string[]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string
          goal: string | null
          id: string
          plan: Json
          status: string
          target_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal?: string | null
          id?: string
          plan?: Json
          status?: string
          target_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string | null
          id?: string
          plan?: Json
          status?: string
          target_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          lesson_id: string | null
          mode: string | null
          seconds: number
          started_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          mode?: string | null
          seconds?: number
          started_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          mode?: string | null
          seconds?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          actor_id: string | null
          event_type: Database["public"]["Enums"]["subscription_event_type"]
          from_plan_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          subscription_id: string
          to_plan_id: string | null
        }
        Insert: {
          actor_id?: string | null
          event_type: Database["public"]["Enums"]["subscription_event_type"]
          from_plan_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          subscription_id: string
          to_plan_id?: string | null
        }
        Update: {
          actor_id?: string | null
          event_type?: Database["public"]["Enums"]["subscription_event_type"]
          from_plan_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          subscription_id?: string
          to_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_to_plan_id_fkey"
            columns: ["to_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          cancel_at: string | null
          cancelled_at: string | null
          company_id: string
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string
          id: string
          metadata: Json
          plan_id: string
          provider: string | null
          provider_ref: string | null
          seats: number
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          cancel_at?: string | null
          cancelled_at?: string | null
          company_id: string
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          metadata?: Json
          plan_id: string
          provider?: string | null
          provider_ref?: string | null
          seats?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          cancel_at?: string | null
          cancelled_at?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          metadata?: Json
          plan_id?: string
          provider?: string | null
          provider_ref?: string | null
          seats?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: Json
          code: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["record_status"]
          tax_id: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          address?: Json
          code?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          address?: Json
          code?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          code: string
          company_id: string
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          rate_bps: number
          region: string | null
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          rate_bps: number
          region?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          rate_bps?: number
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          id: string
          metadata: Json
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          metadata?: Json
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          metadata?: Json
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          ai_persona_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          locale: string
          notification_channels: Json
          preferences: Json
          reduced_motion: boolean
          theme: string
          timezone: string
          updated_at: string
          updated_by: string | null
          user_id: string
          version: number
        }
        Insert: {
          ai_persona_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          locale?: string
          notification_channels?: Json
          preferences?: Json
          reduced_motion?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
          version?: number
        }
        Update: {
          ai_persona_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          locale?: string
          notification_channels?: Json
          preferences?: Json
          reduced_motion?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_bill_items: {
        Row: {
          account_id: string | null
          bill_id: string
          created_at: string
          description: string | null
          id: string
          product_id: string | null
          quantity: number
          tax_cents: number
          tax_rate_id: string | null
          total_cents: number
          unit_price_cents: number
        }
        Insert: {
          account_id?: string | null
          bill_id: string
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          tax_cents?: number
          tax_rate_id?: string | null
          total_cents?: number
          unit_price_cents?: number
        }
        Update: {
          account_id?: string | null
          bill_id?: string
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          tax_cents?: number
          tax_rate_id?: string | null
          total_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bill_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "vendor_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bill_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bill_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_bills: {
        Row: {
          amount_paid_cents: number
          bill_date: string
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          metadata: Json
          notes: string | null
          number: string
          paid_at: string | null
          purchase_order_id: string | null
          status: Database["public"]["Enums"]["fin_bill_status"]
          subtotal_cents: number
          supplier_id: string | null
          supplier_ref: string | null
          tax_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          bill_date?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          number: string
          paid_at?: string | null
          purchase_order_id?: string | null
          status?: Database["public"]["Enums"]["fin_bill_status"]
          subtotal_cents?: number
          supplier_id?: string | null
          supplier_ref?: string | null
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          bill_date?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          number?: string
          paid_at?: string | null
          purchase_order_id?: string | null
          status?: Database["public"]["Enums"]["fin_bill_status"]
          subtotal_cents?: number
          supplier_id?: string | null
          supplier_ref?: string | null
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bills_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_categories: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_category_map: {
        Row: {
          category_id: string
          supplier_id: string
        }
        Insert: {
          category_id: string
          supplier_id: string
        }
        Update: {
          category_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_category_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vendor_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_category_map_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contracts: {
        Row: {
          attachments: Json
          company_id: string
          created_at: string
          currency: string
          ends_on: string | null
          id: string
          starts_on: string | null
          status: string
          supplier_id: string
          terms: string | null
          title: string
          updated_at: string
          value_cents: number
        }
        Insert: {
          attachments?: Json
          company_id: string
          created_at?: string
          currency?: string
          ends_on?: string | null
          id?: string
          starts_on?: string | null
          status?: string
          supplier_id: string
          terms?: string | null
          title: string
          updated_at?: string
          value_cents?: number
        }
        Update: {
          attachments?: Json
          company_id?: string
          created_at?: string
          currency?: string
          ends_on?: string | null
          id?: string
          starts_on?: string | null
          status?: string
          supplier_id?: string
          terms?: string | null
          title?: string
          updated_at?: string
          value_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_documents: {
        Row: {
          company_id: string
          created_at: string
          id: string
          kind: string
          name: string
          supplier_id: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          kind?: string
          name: string
          supplier_id: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          supplier_id?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_quotations: {
        Row: {
          attachments: Json
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          reference: string | null
          request_id: string | null
          status: string
          supplier_id: string
          total_cents: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          attachments?: Json
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          reference?: string | null
          request_id?: string | null
          status?: string
          supplier_id: string
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          attachments?: Json
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          reference?: string | null
          request_id?: string | null
          status?: string
          supplier_id?: string
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_quotations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_quotations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_ratings: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          id: string
          rater_id: string | null
          rating: number
          supplier_id: string
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          rater_id?: string | null
          rating: number
          supplier_id: string
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          rater_id?: string | null
          rating?: number
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_ratings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ratings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_analytics_snapshots: {
        Row: {
          avg_latency_ms: number | null
          by_language: Json
          by_provider: Json
          company_id: string | null
          created_at: string
          failure_rate: number | null
          id: string
          interruptions: number
          period_end: string
          period_start: string
          sessions: number
          total_duration_ms: number
        }
        Insert: {
          avg_latency_ms?: number | null
          by_language?: Json
          by_provider?: Json
          company_id?: string | null
          created_at?: string
          failure_rate?: number | null
          id?: string
          interruptions?: number
          period_end: string
          period_start: string
          sessions?: number
          total_duration_ms?: number
        }
        Update: {
          avg_latency_ms?: number | null
          by_language?: Json
          by_provider?: Json
          company_id?: string | null
          created_at?: string
          failure_rate?: number | null
          id?: string
          interruptions?: number
          period_end?: string
          period_start?: string
          sessions?: number
          total_duration_ms?: number
        }
        Relationships: []
      }
      voice_interruptions: {
        Row: {
          cause: string
          created_at: string
          from_state: string | null
          id: string
          note: string | null
          offset_ms: number | null
          session_id: string
          to_state: string | null
          turn_id: string | null
        }
        Insert: {
          cause: string
          created_at?: string
          from_state?: string | null
          id?: string
          note?: string | null
          offset_ms?: number | null
          session_id: string
          to_state?: string | null
          turn_id?: string | null
        }
        Update: {
          cause?: string
          created_at?: string
          from_state?: string | null
          id?: string
          note?: string | null
          offset_ms?: number | null
          session_id?: string
          to_state?: string | null
          turn_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_interruptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "voice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_interruptions_turn_id_fkey"
            columns: ["turn_id"]
            isOneToOne: false
            referencedRelation: "voice_turns"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_provider_configs: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          label: string | null
          language: string
          priority: number
          provider: string
          style_defaults: Json
          updated_at: string
          voice_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          label?: string | null
          language?: string
          priority?: number
          provider: string
          style_defaults?: Json
          updated_at?: string
          voice_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          label?: string | null
          language?: string
          priority?: number
          provider?: string
          style_defaults?: Json
          updated_at?: string
          voice_id?: string
        }
        Relationships: []
      }
      voice_provider_health: {
        Row: {
          checked_at: string
          error: string | null
          id: string
          latency_ms: number | null
          ok: boolean
          provider: string
        }
        Insert: {
          checked_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          ok: boolean
          provider: string
        }
        Update: {
          checked_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          ok?: boolean
          provider?: string
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          channel: string
          company_id: string | null
          created_at: string
          ended_at: string | null
          error: string | null
          happy_session_id: string | null
          id: string
          language: string
          last_activity_at: string
          meta: Json
          pitch: number | null
          provider: string
          rate: number | null
          started_at: string
          status: string
          style: string
          timeout_at: string | null
          updated_at: string
          user_id: string
          voice_id: string
          volume: number | null
        }
        Insert: {
          channel: string
          company_id?: string | null
          created_at?: string
          ended_at?: string | null
          error?: string | null
          happy_session_id?: string | null
          id?: string
          language?: string
          last_activity_at?: string
          meta?: Json
          pitch?: number | null
          provider: string
          rate?: number | null
          started_at?: string
          status?: string
          style?: string
          timeout_at?: string | null
          updated_at?: string
          user_id: string
          voice_id: string
          volume?: number | null
        }
        Update: {
          channel?: string
          company_id?: string | null
          created_at?: string
          ended_at?: string | null
          error?: string | null
          happy_session_id?: string | null
          id?: string
          language?: string
          last_activity_at?: string
          meta?: Json
          pitch?: number | null
          provider?: string
          rate?: number | null
          started_at?: string
          status?: string
          style?: string
          timeout_at?: string | null
          updated_at?: string
          user_id?: string
          voice_id?: string
          volume?: number | null
        }
        Relationships: []
      }
      voice_turns: {
        Row: {
          audio_bytes: number | null
          audio_ref: string | null
          created_at: string
          duration_ms: number | null
          ended_at: string | null
          id: string
          interrupted: boolean
          kind: string
          language: string | null
          latency_ms: number | null
          provider: string | null
          role: string
          session_id: string
          started_at: string
          text: string | null
          timings: Json
          voice_id: string | null
        }
        Insert: {
          audio_bytes?: number | null
          audio_ref?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          id?: string
          interrupted?: boolean
          kind: string
          language?: string | null
          latency_ms?: number | null
          provider?: string | null
          role: string
          session_id: string
          started_at?: string
          text?: string | null
          timings?: Json
          voice_id?: string | null
        }
        Update: {
          audio_bytes?: number | null
          audio_ref?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          id?: string
          interrupted?: boolean
          kind?: string
          language?: string | null
          latency_ms?: number | null
          provider?: string | null
          role?: string
          session_id?: string
          started_at?: string
          text?: string | null
          timings?: Json
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "voice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger_entries: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          direction: Database["public"]["Enums"]["ledger_direction"]
          entry_type: Database["public"]["Enums"]["wallet_entry_type"]
          id: string
          metadata: Json
          reference_id: string | null
          reference_type: string | null
          wallet_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          direction: Database["public"]["Enums"]["ledger_direction"]
          entry_type: Database["public"]["Enums"]["wallet_entry_type"]
          id?: string
          metadata?: Json
          reference_id?: string | null
          reference_type?: string | null
          wallet_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["ledger_direction"]
          entry_type?: Database["public"]["Enums"]["wallet_entry_type"]
          id?: string
          metadata?: Json
          reference_id?: string | null
          reference_type?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_entries_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "v_wallet_balances"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "wallet_ledger_entries_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          metadata: Json
          owner_id: string
          owner_type: Database["public"]["Enums"]["wallet_owner_type"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          owner_id: string
          owner_type: Database["public"]["Enums"]["wallet_owner_type"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["wallet_owner_type"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      warehouse_bins: {
        Row: {
          capacity: number | null
          code: string
          company_id: string
          created_at: string
          id: string
          metadata: Json
          position: string | null
          rack: string | null
          shelf: string | null
          status: string
          updated_at: string
          warehouse_id: string
          zone_id: string | null
        }
        Insert: {
          capacity?: number | null
          code: string
          company_id: string
          created_at?: string
          id?: string
          metadata?: Json
          position?: string | null
          rack?: string | null
          shelf?: string | null
          status?: string
          updated_at?: string
          warehouse_id: string
          zone_id?: string | null
        }
        Update: {
          capacity?: number | null
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          position?: string | null
          rack?: string | null
          shelf?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_bins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_bins_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_bins_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_zones: {
        Row: {
          aisle: string | null
          code: string
          company_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          sort_order: number
          status: string
          updated_at: string
          warehouse_id: string
          zone_type: Database["public"]["Enums"]["wms_zone_type"]
        }
        Insert: {
          aisle?: string | null
          code: string
          company_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          sort_order?: number
          status?: string
          updated_at?: string
          warehouse_id: string
          zone_type?: Database["public"]["Enums"]["wms_zone_type"]
        }
        Update: {
          aisle?: string | null
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          sort_order?: number
          status?: string
          updated_at?: string
          warehouse_id?: string
          zone_type?: Database["public"]["Enums"]["wms_zone_type"]
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_zones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_zones_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: Json
          code: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          address?: Json
          code?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          address?: Json
          code?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          event: string
          failed_at: string | null
          id: string
          next_attempt_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          succeeded_at: string | null
          webhook_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event: string
          failed_at?: string | null
          id?: string
          next_attempt_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          succeeded_at?: string | null
          webhook_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event?: string
          failed_at?: string | null
          id?: string
          next_attempt_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          succeeded_at?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          events: string[]
          id: string
          is_active: boolean
          name: string
          secret: string
          updated_at: string
          updated_by: string | null
          url: string
          version: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          name: string
          secret: string
          updated_at?: string
          updated_by?: string | null
          url: string
          version?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          secret?: string
          updated_at?: string
          updated_by?: string | null
          url?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          input: Json | null
          output: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          steps: Json
          trigger: Json
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          steps?: Json
          trigger?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          trigger?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role_id: string | null
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          brand_id: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_credit_balances: {
        Row: {
          balance: number | null
          entry_count: number | null
          last_entry_at: string | null
          owner_id: string | null
          owner_type: Database["public"]["Enums"]["wallet_owner_type"] | null
        }
        Relationships: []
      }
      v_credit_totals: {
        Row: {
          consumed: number | null
          expired: number | null
          issued: number | null
          owner_id: string | null
          owner_type: Database["public"]["Enums"]["wallet_owner_type"] | null
          refunded: number | null
        }
        Relationships: []
      }
      v_wallet_balances: {
        Row: {
          balance_cents: number | null
          currency: string | null
          entry_count: number | null
          last_entry_at: string | null
          owner_id: string | null
          owner_type: Database["public"]["Enums"]["wallet_owner_type"] | null
          wallet_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _hxp_attach_touch: { Args: { _tbl: unknown }; Returns: undefined }
      get_effective_setting: {
        Args: {
          _brand_id?: string
          _company_id?: string
          _department_id?: string
          _key: string
          _user_id?: string
          _workspace_id?: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_ops_admin: { Args: { _user_id: string }; Returns: boolean }
      is_platform_founder: { Args: { _user_id: string }; Returns: boolean }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: {
          _permission_code: string
          _scope_id?: string
          _scope_type?: Database["public"]["Enums"]["scope_type"]
          _user_id: string
        }
        Returns: boolean
      }
      write_audit: {
        Args: {
          _action: string
          _after?: Json
          _before?: Json
          _category: string
          _company_id?: string
          _entity_id?: string
          _entity_type?: string
          _metadata?: Json
          _severity?: Database["public"]["Enums"]["audit_severity"]
        }
        Returns: string
      }
    }
    Enums: {
      ai_session_status: "active" | "ended" | "error"
      alert_severity: "info" | "warning" | "critical"
      app_role: "founder" | "admin" | "enterprise" | "user"
      audit_severity: "info" | "notice" | "warning" | "critical"
      billing_interval:
        | "month"
        | "quarter"
        | "half_year"
        | "year"
        | "three_year"
        | "five_year"
        | "lifetime"
      credit_entry_type:
        | "purchase"
        | "consume"
        | "refund"
        | "expire"
        | "transfer_in"
        | "transfer_out"
        | "bonus"
        | "referral"
        | "admin_grant"
        | "marketplace_usage"
        | "ai_usage"
        | "builder_usage"
        | "automation_usage"
      deal_stage:
        | "lead"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      deployment_status:
        | "pending"
        | "in_progress"
        | "succeeded"
        | "failed"
        | "rolled_back"
      deployment_strategy: "rolling" | "blue_green" | "canary" | "hotfix"
      enrollment_status: "enrolled" | "in_progress" | "completed" | "dropped"
      entity_status: "active" | "inactive" | "archived" | "suspended"
      fin_bank_txn_type:
        | "deposit"
        | "withdrawal"
        | "transfer_in"
        | "transfer_out"
        | "fee"
        | "interest"
        | "adjustment"
      fin_bill_status:
        | "draft"
        | "pending"
        | "approved"
        | "paid"
        | "partial"
        | "cancelled"
        | "overdue"
      fin_gst_status: "draft" | "filed" | "paid" | "cancelled"
      fin_journal_status: "draft" | "posted" | "reversed"
      fin_note_kind: "credit" | "debit"
      fin_recon_status: "open" | "in_progress" | "completed"
      ha_event_severity: "info" | "warning" | "critical"
      ha_failover_kind: "automatic" | "manual" | "graceful" | "rollback"
      ha_failover_status:
        | "planned"
        | "running"
        | "succeeded"
        | "failed"
        | "rolled_back"
      ha_region_role: "primary" | "secondary" | "standby" | "edge"
      ha_region_status: "healthy" | "degraded" | "offline" | "recovering"
      ha_replication_scope:
        | "database_metadata"
        | "configuration"
        | "builder_projects"
        | "marketplace_metadata"
        | "automation_definitions"
        | "knowledge_graph"
        | "memory_metadata"
      ha_replication_status:
        | "in_sync"
        | "lagging"
        | "diverged"
        | "failed"
        | "unknown"
      ha_traffic_policy:
        | "primary_only"
        | "active_active"
        | "weighted"
        | "geo"
        | "failover"
      health_status: "ok" | "degraded" | "down" | "unknown"
      incident_status:
        | "open"
        | "investigating"
        | "identified"
        | "monitoring"
        | "resolved"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "overdue"
        | "void"
        | "refunded"
      job_status: "queued" | "running" | "succeeded" | "failed" | "cancelled"
      ledger_direction: "credit" | "debit"
      membership_status: "invited" | "active" | "suspended" | "removed"
      notification_channel: "in_app" | "email" | "sms" | "push" | "webhook"
      payment_provider_code:
        | "stripe"
        | "razorpay"
        | "paddle"
        | "cashfree"
        | "paypal"
        | "manual"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      plan_tier:
        | "free"
        | "starter"
        | "professional"
        | "business"
        | "enterprise"
        | "custom"
      project_deployment_env:
        | "development"
        | "preview"
        | "staging"
        | "production"
      project_deployment_state:
        | "queued"
        | "building"
        | "deploying"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "rolled_back"
      project_deployment_target:
        | "web"
        | "pwa"
        | "static_export"
        | "cloudflare"
        | "netlify"
        | "vercel"
        | "custom"
      project_domain_status:
        | "pending"
        | "verifying"
        | "verified"
        | "failed"
        | "removed"
      record_status:
        | "draft"
        | "active"
        | "archived"
        | "deleted"
        | "pending"
        | "suspended"
      scope_type:
        | "platform"
        | "company"
        | "brand"
        | "workspace"
        | "department"
        | "team"
      subscription_event_type:
        | "created"
        | "trial_started"
        | "activated"
        | "renewed"
        | "upgraded"
        | "downgraded"
        | "paused"
        | "resumed"
        | "cancelled"
        | "expired"
        | "payment_failed"
      subscription_status:
        | "trial"
        | "active"
        | "paused"
        | "past_due"
        | "cancelled"
        | "expired"
      wallet_entry_type:
        | "purchase"
        | "refund"
        | "reward"
        | "referral"
        | "adjustment"
        | "marketplace_earning"
        | "builder_earning"
        | "consume"
        | "payout"
        | "chargeback"
      wallet_owner_type: "user" | "company"
      webhook_process_status:
        | "received"
        | "processed"
        | "ignored"
        | "failed"
        | "dead"
      webhook_verify_result:
        | "verified"
        | "bad_signature"
        | "expired"
        | "replay"
        | "missing"
        | "error"
      wms_count_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "approved"
        | "cancelled"
      wms_lot_status:
        | "available"
        | "quarantine"
        | "damaged"
        | "expired"
        | "consumed"
        | "on_hold"
      wms_reservation_status:
        | "active"
        | "released"
        | "fulfilled"
        | "expired"
        | "cancelled"
      wms_transfer_status: "draft" | "in_transit" | "received" | "cancelled"
      wms_txn_type:
        | "receive"
        | "issue"
        | "transfer_out"
        | "transfer_in"
        | "adjustment"
        | "damage"
        | "expiry"
        | "return"
        | "reserve"
        | "release"
        | "count_adjust"
        | "production_in"
        | "production_out"
      wms_valuation: "FIFO" | "FEFO" | "LIFO" | "WEIGHTED_AVG"
      wms_zone_type:
        | "storage"
        | "receiving"
        | "dispatch"
        | "staging"
        | "quarantine"
        | "damage"
        | "returns"
        | "production"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_session_status: ["active", "ended", "error"],
      alert_severity: ["info", "warning", "critical"],
      app_role: ["founder", "admin", "enterprise", "user"],
      audit_severity: ["info", "notice", "warning", "critical"],
      billing_interval: [
        "month",
        "quarter",
        "half_year",
        "year",
        "three_year",
        "five_year",
        "lifetime",
      ],
      credit_entry_type: [
        "purchase",
        "consume",
        "refund",
        "expire",
        "transfer_in",
        "transfer_out",
        "bonus",
        "referral",
        "admin_grant",
        "marketplace_usage",
        "ai_usage",
        "builder_usage",
        "automation_usage",
      ],
      deal_stage: [
        "lead",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      deployment_status: [
        "pending",
        "in_progress",
        "succeeded",
        "failed",
        "rolled_back",
      ],
      deployment_strategy: ["rolling", "blue_green", "canary", "hotfix"],
      enrollment_status: ["enrolled", "in_progress", "completed", "dropped"],
      entity_status: ["active", "inactive", "archived", "suspended"],
      fin_bank_txn_type: [
        "deposit",
        "withdrawal",
        "transfer_in",
        "transfer_out",
        "fee",
        "interest",
        "adjustment",
      ],
      fin_bill_status: [
        "draft",
        "pending",
        "approved",
        "paid",
        "partial",
        "cancelled",
        "overdue",
      ],
      fin_gst_status: ["draft", "filed", "paid", "cancelled"],
      fin_journal_status: ["draft", "posted", "reversed"],
      fin_note_kind: ["credit", "debit"],
      fin_recon_status: ["open", "in_progress", "completed"],
      ha_event_severity: ["info", "warning", "critical"],
      ha_failover_kind: ["automatic", "manual", "graceful", "rollback"],
      ha_failover_status: [
        "planned",
        "running",
        "succeeded",
        "failed",
        "rolled_back",
      ],
      ha_region_role: ["primary", "secondary", "standby", "edge"],
      ha_region_status: ["healthy", "degraded", "offline", "recovering"],
      ha_replication_scope: [
        "database_metadata",
        "configuration",
        "builder_projects",
        "marketplace_metadata",
        "automation_definitions",
        "knowledge_graph",
        "memory_metadata",
      ],
      ha_replication_status: [
        "in_sync",
        "lagging",
        "diverged",
        "failed",
        "unknown",
      ],
      ha_traffic_policy: [
        "primary_only",
        "active_active",
        "weighted",
        "geo",
        "failover",
      ],
      health_status: ["ok", "degraded", "down", "unknown"],
      incident_status: [
        "open",
        "investigating",
        "identified",
        "monitoring",
        "resolved",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "void", "refunded"],
      job_status: ["queued", "running", "succeeded", "failed", "cancelled"],
      ledger_direction: ["credit", "debit"],
      membership_status: ["invited", "active", "suspended", "removed"],
      notification_channel: ["in_app", "email", "sms", "push", "webhook"],
      payment_provider_code: [
        "stripe",
        "razorpay",
        "paddle",
        "cashfree",
        "paypal",
        "manual",
      ],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      plan_tier: [
        "free",
        "starter",
        "professional",
        "business",
        "enterprise",
        "custom",
      ],
      project_deployment_env: [
        "development",
        "preview",
        "staging",
        "production",
      ],
      project_deployment_state: [
        "queued",
        "building",
        "deploying",
        "succeeded",
        "failed",
        "cancelled",
        "rolled_back",
      ],
      project_deployment_target: [
        "web",
        "pwa",
        "static_export",
        "cloudflare",
        "netlify",
        "vercel",
        "custom",
      ],
      project_domain_status: [
        "pending",
        "verifying",
        "verified",
        "failed",
        "removed",
      ],
      record_status: [
        "draft",
        "active",
        "archived",
        "deleted",
        "pending",
        "suspended",
      ],
      scope_type: [
        "platform",
        "company",
        "brand",
        "workspace",
        "department",
        "team",
      ],
      subscription_event_type: [
        "created",
        "trial_started",
        "activated",
        "renewed",
        "upgraded",
        "downgraded",
        "paused",
        "resumed",
        "cancelled",
        "expired",
        "payment_failed",
      ],
      subscription_status: [
        "trial",
        "active",
        "paused",
        "past_due",
        "cancelled",
        "expired",
      ],
      wallet_entry_type: [
        "purchase",
        "refund",
        "reward",
        "referral",
        "adjustment",
        "marketplace_earning",
        "builder_earning",
        "consume",
        "payout",
        "chargeback",
      ],
      wallet_owner_type: ["user", "company"],
      webhook_process_status: [
        "received",
        "processed",
        "ignored",
        "failed",
        "dead",
      ],
      webhook_verify_result: [
        "verified",
        "bad_signature",
        "expired",
        "replay",
        "missing",
        "error",
      ],
      wms_count_status: [
        "scheduled",
        "in_progress",
        "completed",
        "approved",
        "cancelled",
      ],
      wms_lot_status: [
        "available",
        "quarantine",
        "damaged",
        "expired",
        "consumed",
        "on_hold",
      ],
      wms_reservation_status: [
        "active",
        "released",
        "fulfilled",
        "expired",
        "cancelled",
      ],
      wms_transfer_status: ["draft", "in_transit", "received", "cancelled"],
      wms_txn_type: [
        "receive",
        "issue",
        "transfer_out",
        "transfer_in",
        "adjustment",
        "damage",
        "expiry",
        "return",
        "reserve",
        "release",
        "count_adjust",
        "production_in",
        "production_out",
      ],
      wms_valuation: ["FIFO", "FEFO", "LIFO", "WEIGHTED_AVG"],
      wms_zone_type: [
        "storage",
        "receiving",
        "dispatch",
        "staging",
        "quarantine",
        "damage",
        "returns",
        "production",
      ],
    },
  },
} as const

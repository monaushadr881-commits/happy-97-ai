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
      listings: {
        Row: {
          category: string | null
          company_id: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          description: string | null
          id: string
          price_cents: number
          product_id: string | null
          rating_avg: number
          rating_count: number
          seller_id: string
          slug: string
          status: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          price_cents?: number
          product_id?: string | null
          rating_avg?: number
          rating_count?: number
          seller_id: string
          slug: string
          status?: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          category?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          price_cents?: number
          product_id?: string | null
          rating_avg?: number
          rating_count?: number
          seller_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["record_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
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
          updated_at?: string
        }
        Relationships: []
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
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      plan_tier:
        | "free"
        | "starter"
        | "professional"
        | "business"
        | "enterprise"
        | "custom"
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
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      plan_tier: [
        "free",
        "starter",
        "professional",
        "business",
        "enterprise",
        "custom",
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
    },
  },
} as const

/**
 * Database type definitions for NewGenPlus.
 *
 * This file is the source of truth for all DB types used across the app.
 * Regenerate with:
 *   npx supabase gen types typescript --local > src/types/database.types.ts
 *
 * Until the Supabase project is linked, these types are hand-authored to match
 * the schema in supabase/migrations/002_core_tables.sql.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---------------------------------------------------------------------------
// Enum types (mirror 001_extensions_and_types.sql)
// ---------------------------------------------------------------------------

export type ResourceType = 'image' | 'video' | 'website-kit' | 'workflow'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type AdminRole = 'admin' | 'super_admin'
export type EventType = 'view' | 'copy' | 'review_submit' | 'share' | 'bookmark' | 'like'

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export interface AdminUserRow {
  id: string
  email: string
  role: AdminRole
  created_at: string
  updated_at: string
}

export interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  status: ContentStatus
  created_at: string
  updated_at: string
}

export interface ModelRow {
  id: string
  name: string
  slug: string
  description: string | null
  logo_path: string | null
  provider: string | null
  status: ContentStatus
  created_at: string
  updated_at: string
}

export interface ResourceRow {
  id: string
  resource_type: ResourceType
  title: string
  slug: string
  description: string | null
  prompt_text: string | null
  creator_name: string
  category_id: string | null
  model_id: string | null
  tags: string[]
  status: ContentStatus
  published_at: string | null
  view_count: number
  copy_count: number
  review_count: number
  avg_rating: number | null
  search_vector: string | null
  created_at: string
  updated_at: string
}

export interface ReviewRow {
  id: string
  resource_id: string
  reviewer_name: string
  reviewer_email: string
  rating: number | null
  body: string
  status: ReviewStatus
  approved_at: string | null
  ip_hash: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Database shape (used by Supabase client generics)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: AdminUserRow
        Insert: Omit<AdminUserRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<AdminUserRow, 'id'>>
        Relationships: []
      }
      categories: {
        Row: CategoryRow
        Insert: Omit<CategoryRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CategoryRow, 'id'>>
        Relationships: []
      }
      models: {
        Row: ModelRow
        Insert: Omit<ModelRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ModelRow, 'id'>>
        Relationships: []
      }
      resources: {
        Row: ResourceRow
        Insert: Omit<ResourceRow, 'id' | 'created_at' | 'updated_at' | 'search_vector'>
        Update: Partial<Omit<ResourceRow, 'id' | 'search_vector'>>
        Relationships: [
          {
            foreignKeyName: 'resources_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'resources_model_id_fkey'
            columns: ['model_id']
            isOneToOne: false
            referencedRelation: 'models'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: ReviewRow
        Insert: Omit<ReviewRow, 'id' | 'created_at'>
        Update: Partial<Omit<ReviewRow, 'id'>>
        Relationships: [
          {
            foreignKeyName: 'reviews_resource_id_fkey'
            columns: ['resource_id']
            isOneToOne: false
            referencedRelation: 'resources'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      increment_view_count: {
        Args: {
          p_resource_id: string
          p_session_id?: string
          p_ip_hash?: string
          p_referrer?: string
          p_country_code?: string
        }
        Returns: void
      }
      increment_copy_count: {
        Args: {
          p_resource_id: string
          p_session_id?: string
          p_ip_hash?: string
          p_country_code?: string
        }
        Returns: void
      }
    }
    Enums: {
      resource_type: ResourceType
      content_status: ContentStatus
      review_status: ReviewStatus
      admin_role: AdminRole
      event_type: EventType
    }
  }
}

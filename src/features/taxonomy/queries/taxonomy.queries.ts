/**
 * Public taxonomy queries — published categories and models for filter bars
 * and landing pages. Server-only, scoped to published rows.
 */
import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { trySelectMany, trySelectMaybeOne } from '@/lib/supabase/query'
import type { CategoryRow, ModelRow } from '@/types/database.types'

export interface TaxonomyItem {
  id: string
  name: string
  slug: string
  logo_path?: string | null
}

export async function listPublishedCategories(): Promise<TaxonomyItem[]> {
  const supabase = createAdminClient()
  return trySelectMany<TaxonomyItem>(
    supabase
      .from('categories')
      .select('id, name, slug')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
  )
}

export async function listPublishedModels(): Promise<TaxonomyItem[]> {
  const supabase = createAdminClient()
  return trySelectMany<TaxonomyItem>(
    supabase
      .from('models')
      .select('id, name, slug, logo_path')
      .eq('status', 'published')
      .order('name', { ascending: true })
  )
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const supabase = createAdminClient()
  return trySelectMaybeOne<CategoryRow>(
    supabase.from('categories').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
  )
}

export async function getModelBySlug(slug: string): Promise<ModelRow | null> {
  const supabase = createAdminClient()
  return trySelectMaybeOne<ModelRow>(
    supabase.from('models').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
  )
}

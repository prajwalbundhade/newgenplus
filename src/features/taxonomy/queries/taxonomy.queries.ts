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
  provider?: string | null
}

export interface TaxonomyItemWithCount extends TaxonomyItem {
  promptCount: number
}

export async function listTopModelsByPromptCount(limit = 4): Promise<TaxonomyItemWithCount[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('resources')                     // ← was 'prompts'
    .select('model_id, models!inner(id, name, slug, logo_path, provider)')
    .eq('status', 'published')
    .eq('models.status', 'published') as unknown as {
      data: Array<{ model_id: string; models: TaxonomyItem }> | null
      error: unknown
    }

  if (error || !data) return []

  const countMap = new Map<string, { item: TaxonomyItem; count: number }>()

  for (const row of data) {
    const model = row.models
    if (!model?.id) continue
    const entry = countMap.get(model.id)
    if (entry) {
      entry.count++
    } else {
      countMap.set(model.id, { item: model, count: 1 })
    }
  }

  return [...countMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ item, count }) => ({ ...item, promptCount: count }))
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

export async function listRelatedCategories(
  currentSlug: string,
  limit = 6
): Promise<TaxonomyItem[]> {
  const categories = await listPublishedCategories()
  return categories.filter((category) => category.slug !== currentSlug).slice(0, limit)
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

export async function listRelatedModels(
  currentSlug: string,
  limit = 6
): Promise<TaxonomyItemWithCount[]> {
  const models = await listTopModelsByPromptCount(limit + 1)
  return models.filter((model) => model.slug !== currentSlug).slice(0, limit)
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

// ---------------------------------------------------------------------------
// SEO helpers (sitemap)
// ---------------------------------------------------------------------------

export interface TaxonomySitemapEntry {
  slug: string
  updatedAt: string | null
}

export async function listCategorySitemapEntries(): Promise<TaxonomySitemapEntry[]> {
  const supabase = createAdminClient()
  const rows = await trySelectMany<Pick<CategoryRow, 'slug' | 'updated_at'>>(
    supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
  )
  return rows.map((r) => ({ slug: r.slug, updatedAt: r.updated_at }))
}

export async function listModelSitemapEntries(): Promise<TaxonomySitemapEntry[]> {
  const supabase = createAdminClient()
  const rows = await trySelectMany<Pick<ModelRow, 'slug' | 'updated_at'>>(
    supabase
      .from('models')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('name', { ascending: true })
  )
  return rows.map((r) => ({ slug: r.slug, updatedAt: r.updated_at }))
}

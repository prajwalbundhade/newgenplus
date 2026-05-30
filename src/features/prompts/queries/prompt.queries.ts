/**
 * Public prompt read queries.
 *
 * Server-only. Uses the service-role client for deterministic reads (the live
 * DB has RLS drift), but EVERY query is explicitly scoped to
 * status = 'published' so only public content is ever returned. Reviewer
 * email and other PII are never selected.
 *
 * Non-throwing (try*) variants are used so a transient error degrades the page
 * gracefully rather than crashing the public read path.
 */
import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { trySelectMany, trySelectMaybeOne } from '@/lib/supabase/query'
import { publicStorageUrl } from '@/lib/supabase/storage'
import type {
  ResourceRow,
  ResourceMediaRow,
  CategoryRow,
  ModelRow,
  ReviewRow,
} from '@/types/database.types'

// ---------------------------------------------------------------------------
// View models (public-safe DTOs)
// ---------------------------------------------------------------------------

export interface PromptCardVM {
  id: string
  title: string
  slug: string
  creatorName: string
  modelName: string | null
  modelSlug: string | null
  imageUrl: string | null
  blurDataUrl: string | null
  width: number | null
  height: number | null
  viewCount: number
  copyCount: number
  likeCount: number
  avgRating: number | null
  isFeatured: boolean
}

export interface PromptDetailVM extends PromptCardVM {
  description: string | null
  promptText: string | null
  tags: string[]
  reviewCount: number
  publishedAt: string | null
  categoryId: string | null
  category: { name: string; slug: string } | null
  model: { name: string; slug: string, logo_path: string | null } | null
}

export interface PublicReviewVM {
  id: string
  reviewerName: string
  rating: number | null
  body: string
  createdAt: string
}

const PARENT_BUCKET_FALLBACK = 'resource-images'

type MediaPick = Pick<
  ResourceMediaRow,
  'storage_bucket' | 'storage_path' | 'blur_data_url' | 'width' | 'height'
>

/**
 * PostgREST returns an embedded one-to-one relationship as a single object
 * (resource_media has a UNIQUE constraint on resource_id), but a one-to-many
 * as an array. Normalize both to the first media record.
 */
function pickMedia(value: MediaPick | MediaPick[] | null | undefined): MediaPick | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

type ModelPick = { name: string; slug: string }

type ResourceWithMedia = ResourceRow & {
  resource_media: MediaPick | MediaPick[] | null
  models: ModelPick | ModelPick[] | null
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function toCardVM(row: ResourceWithMedia): PromptCardVM {
  const media = pickMedia(row.resource_media)
  const model = pickOne<ModelPick>(row.models)
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    creatorName: row.creator_name,
    modelName: model?.name ?? null,
    modelSlug: model?.slug ?? null,
    imageUrl: media
      ? publicStorageUrl(media.storage_bucket || PARENT_BUCKET_FALLBACK, media.storage_path)
      : null,
    blurDataUrl: media?.blur_data_url ?? null,
    width: media?.width ?? null,
    height: media?.height ?? null,
    viewCount: row.view_count,
    copyCount: row.copy_count,
    likeCount: row.like_count ?? 0,
    avgRating: row.avg_rating,
    isFeatured: row.is_featured,
  }
}

const CARD_SELECT =
  'id, title, slug, creator_name, view_count, copy_count, like_count, avg_rating, is_featured, ' +
  'resource_media(storage_bucket, storage_path, blur_data_url, width, height), ' +
  'models(name, slug)'

// ---------------------------------------------------------------------------
// Feed sorts
// ---------------------------------------------------------------------------

export type FeedSort = 'recent' | 'trending' | 'top'

interface ListOptions {
  sort?: FeedSort
  limit?: number
  offset?: number
  categorySlug?: string
  modelSlug?: string
}

export async function listPublishedPrompts(options: ListOptions = {}): Promise<PromptCardVM[]> {
  const { sort = 'recent', limit = 24, offset = 0, categorySlug, modelSlug } = options
  const supabase = createAdminClient()

  let query = supabase
    .from('resources')
    .select(CARD_SELECT)
    .eq('status', 'published')

  // Optional taxonomy filters resolved to ids first.
  if (categorySlug) {
    const cat = await trySelectMaybeOne<Pick<CategoryRow, 'id'>>(
      supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle()
    )
    if (!cat) return []
    query = query.eq('category_id', cat.id)
  }
  if (modelSlug) {
    const model = await trySelectMaybeOne<Pick<ModelRow, 'id'>>(
      supabase.from('models').select('id').eq('slug', modelSlug).maybeSingle()
    )
    if (!model) return []
    query = query.eq('model_id', model.id)
  }

  // Sort
  if (sort === 'trending') {
    query = query.order('published_at', { ascending: false })        // Newest
  } else if (sort === 'top') {
    query = query.order('like_count', { ascending: false })          // Popular
  } else {
    query = query.order('is_featured', { ascending: false })         // Featured
      .order('published_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const rows = await trySelectMany<ResourceWithMedia>(query)
  return rows.map(toCardVM)
}

export async function listFeaturedPrompts(limit = 8): Promise<PromptCardVM[]> {
  const supabase = createAdminClient()
  const rows = await trySelectMany<ResourceWithMedia>(
    supabase
      .from('resources')
      .select(CARD_SELECT)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(limit)
  )
  return rows.map(toCardVM)
}

export async function searchPublishedPrompts(term: string, limit = 48): Promise<PromptCardVM[]> {
  const cleaned = term.trim()
  if (!cleaned) return []
  const supabase = createAdminClient()

  // websearch_to_tsquery via the generated search_vector column.
  const rows = await trySelectMany<ResourceWithMedia>(
    supabase
      .from('resources')
      .select(CARD_SELECT)
      .eq('status', 'published')
      .textSearch('search_vector', cleaned, { type: 'websearch', config: 'english' })
      .limit(limit)
  )
  return rows.map(toCardVM)
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

type ResourceDetailRow = ResourceRow & {
  resource_media: MediaPick | MediaPick[] | null
  categories: { name: string; slug: string } | null
  models: { name: string; slug: string, logo_path: string | null } | null
}

export async function getPromptBySlug(slug: string): Promise<PromptDetailVM | null> {
  const supabase = createAdminClient()
  const row = await trySelectMaybeOne<ResourceDetailRow>(
    supabase
      .from('resources')
      .select(
        '*, resource_media(storage_bucket, storage_path, blur_data_url, width, height), ' +
        'categories(name, slug), models(name, slug, logo_path)'
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
  )
  if (!row) return null

  const card = toCardVM(row)
  return {
    ...card,
    description: row.description,
    promptText: row.prompt_text,
    tags: row.tags ?? [],
    reviewCount: row.review_count,
    publishedAt: row.published_at,
    categoryId: row.category_id,
    category: row.categories,
    model: row.models,
  }
}

/** Slugs for generateStaticParams. */
export async function listPublishedSlugs(limit = 1000): Promise<string[]> {
  const supabase = createAdminClient()
  const rows = await trySelectMany<Pick<ResourceRow, 'slug'>>(
    supabase
      .from('resources')
      .select('slug')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)
  )
  return rows.map((r) => r.slug)
}

/** Similar prompts: same category, excluding the current one. */
export async function listSimilarPrompts(
  resourceId: string,
  categoryId: string | null,
  limit = 6
): Promise<PromptCardVM[]> {
  if (!categoryId) return []
  const supabase = createAdminClient()
  const rows = await trySelectMany<ResourceWithMedia>(
    supabase
      .from('resources')
      .select(CARD_SELECT)
      .eq('status', 'published')
      .eq('category_id', categoryId)
      .neq('id', resourceId)
      .order('copy_count', { ascending: false })
      .limit(limit)
  )
  return rows.map(toCardVM)
}

// ---------------------------------------------------------------------------
// Reviews (public, approved only — never selects reviewer_email)
// ---------------------------------------------------------------------------

export async function listApprovedReviews(resourceId: string, limit = 20): Promise<PublicReviewVM[]> {
  const supabase = createAdminClient()
  const rows = await trySelectMany<
    Pick<ReviewRow, 'id' | 'reviewer_name' | 'rating' | 'body' | 'created_at'>
  >(
    supabase
      .from('reviews')
      .select('id, reviewer_name, rating, body, created_at')
      .eq('resource_id', resourceId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit)
  )
  return rows.map((r) => ({
    id: r.id,
    reviewerName: r.reviewer_name,
    rating: r.rating,
    body: r.body,
    createdAt: r.created_at,
  }))
}

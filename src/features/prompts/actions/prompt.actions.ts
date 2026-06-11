'use server'

/**
 * Prompt (resource) admin Server Actions.
 *
 * Authorization: every action calls guardAdmin() first (DAL RPC-based check).
 * Data access: service-role client. This is deliberate — the live DB has
 * known RLS drift, so authorization is enforced in the guarded action rather
 * than relying on table policies. The service-role client never reaches the
 * browser (server-only module).
 *
 * All actions return a typed ActionResult and revalidate affected public ISR paths.
 */

import { revalidatePath } from 'next/cache'
import { guardAdmin } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { selectMaybeOne, selectOne, writePayload } from '@/lib/supabase/query'
import { type ActionResult, ok, fail } from '@/lib/action-result'
import { uniqueSlug } from '@/lib/utils/slug'
import { STORAGE_BUCKETS } from '@/lib/supabase/storage'
import { MAX_IMAGE_BYTES, MAX_IMAGE_LABEL } from '@/config/upload'
import {
  PromptCreateSchema,
  PromptUpdateSchema,
} from '@/features/prompts/schemas/prompt.schema'
import { optimizeImage } from '@/lib/server/image-optimizer'
import type {
  CategoryRow,
  ModelRow,
  ResourceRow,
  ResourceMediaRow,
} from '@/types/database.types'

// ---------------------------------------------------------------------------
// Public ISR helpers
// ---------------------------------------------------------------------------

type PromptRevalidationInfo = Pick<
  ResourceRow,
  'slug' | 'status' | 'category_id' | 'model_id' | 'published_at'
>

async function getPromptRevalidationInfo(id: string): Promise<PromptRevalidationInfo | null> {
  const supabase = createAdminClient()
  return selectMaybeOne<PromptRevalidationInfo>(
    supabase
      .from('resources')
      .select('slug,status,category_id,model_id,published_at')
      .eq('id', id)
      .maybeSingle()
  )
}

async function addTaxonomyPaths(paths: Set<string>, resource: PromptRevalidationInfo) {
  const supabase = createAdminClient()
  const [category, model] = await Promise.all([
    resource.category_id
      ? selectMaybeOne<Pick<CategoryRow, 'slug' | 'status'>>(
        supabase.from('categories').select('slug,status').eq('id', resource.category_id).maybeSingle()
      )
      : null,
    resource.model_id
      ? selectMaybeOne<Pick<ModelRow, 'slug' | 'status'>>(
        supabase.from('models').select('slug,status').eq('id', resource.model_id).maybeSingle()
      )
      : null,
  ])

  if (category?.status === 'published') paths.add(`/category/${category.slug}`)
  if (model?.status === 'published') paths.add(`/model/${model.slug}`)
}

async function revalidatePromptPublicSurfaces(
  ...resources: Array<PromptRevalidationInfo | null | undefined>
) {
  const publishedResources = resources.filter(
    (resource): resource is PromptRevalidationInfo => resource?.status === 'published'
  )

  if (publishedResources.length === 0) return

  const paths = new Set<string>(['/'])

  for (const resource of publishedResources) {
    paths.add(`/prompt/${resource.slug}`)
    await addTaxonomyPaths(paths, resource)
  }

  for (const path of paths) revalidatePath(path)
}

function revalidateHomepageForPublishedPrompt(resource: PromptRevalidationInfo | null) {
  if (resource?.status === 'published') revalidatePath('/')
}

/** Parse FormData into a plain object the Zod schema accepts. */
function formToObject(formData: FormData): Record<string, unknown> {
  return {
    title: formData.get('title') ?? undefined,
    description: formData.get('description') ?? undefined,
    prompt_text: formData.get('prompt_text') ?? undefined,
    creator_name: formData.get('creator_name') || undefined,
    resource_type: formData.get('resource_type') || undefined,
    // Empty select → empty string, which fails the required check with a
    // proper "Category/Model is required." message.
    category_id: (formData.get('category_id') as string) ?? '',
    model_id: (formData.get('model_id') as string) ?? '',
    tags: (formData.get('tags') as string) ?? '',
    status: formData.get('status') || undefined,
    is_featured: formData.get('is_featured') === 'on' || formData.get('is_featured') === 'true',
  }
}

// ---------------------------------------------------------------------------
// createPrompt
// ---------------------------------------------------------------------------

export async function createPrompt(
  formData: FormData
): Promise<ActionResult<{ id: string; slug: string }>> {
  await guardAdmin()

  const parsed = PromptCreateSchema.safeParse(formToObject(formData))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.map(String).join('.')] = issue.message
    }
    return fail('Please correct the highlighted fields.', fieldErrors)
  }

  const input = parsed.data
  const supabase = createAdminClient()
  const slug = uniqueSlug(input.title)
  const isPublished = input.status === 'published'

  try {
    const created = await selectOne<ResourceRow>(
      supabase
        .from('resources')
        .insert(
          writePayload({
            resource_type: input.resource_type,
            title: input.title,
            slug,
            description: input.description || null,
            prompt_text: input.prompt_text,
            creator_name: input.creator_name,
            category_id: input.category_id ?? null,
            model_id: input.model_id ?? null,
            tags: input.tags,
            status: input.status,
            is_featured: input.is_featured,
            // DB CHECK requires published_at when status = published
            published_at: isPublished ? new Date().toISOString() : null,
          })
        )
        .select('*')
        .single()
    )

    await revalidatePromptPublicSurfaces(created)
    return ok({ id: created.id, slug: created.slug })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to create prompt.')
  }
}

// ---------------------------------------------------------------------------
// updatePrompt
// ---------------------------------------------------------------------------

export async function updatePrompt(
  formData: FormData
): Promise<ActionResult<{ id: string; slug: string }>> {
  await guardAdmin()

  const raw = { ...formToObject(formData), id: formData.get('id') }
  const parsed = PromptUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.map(String).join('.')] = issue.message
    }
    return fail('Please correct the highlighted fields.', fieldErrors)
  }

  const { id, ...fields } = parsed.data
  const supabase = createAdminClient()

  try {
    // Load current row to handle published_at transition correctly.
    const current = await selectMaybeOne<PromptRevalidationInfo>(
      supabase
        .from('resources')
        .select('slug,status,category_id,model_id,published_at')
        .eq('id', id)
        .maybeSingle()
    )
    if (!current) return fail('Prompt not found.')

    const update: Record<string, unknown> = {
      ...(fields.title !== undefined && { title: fields.title }),
      ...(fields.description !== undefined && { description: fields.description || null }),
      ...(fields.prompt_text !== undefined && { prompt_text: fields.prompt_text }),
      ...(fields.creator_name !== undefined && { creator_name: fields.creator_name }),
      ...(fields.resource_type !== undefined && { resource_type: fields.resource_type }),
      ...(fields.category_id !== undefined && { category_id: fields.category_id ?? null }),
      ...(fields.model_id !== undefined && { model_id: fields.model_id ?? null }),
      ...(fields.tags !== undefined && { tags: fields.tags }),
      ...(fields.is_featured !== undefined && { is_featured: fields.is_featured }),
    }

    // Status transition: set/clear published_at to satisfy the DB CHECK.
    if (fields.status !== undefined) {
      update.status = fields.status
      if (fields.status === 'published' && current.published_at === null) {
        update.published_at = new Date().toISOString()
      }
    }

    const updated = await selectOne<ResourceRow>(
      supabase.from('resources').update(writePayload(update)).eq('id', id).select('*').single()
    )

    await revalidatePromptPublicSurfaces(current, updated)
    return ok({ id: updated.id, slug: updated.slug })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to update prompt.')
  }
}

// ---------------------------------------------------------------------------
// setPromptStatus  (publish / unpublish / archive)
// ---------------------------------------------------------------------------

export async function setPromptStatus(
  id: string,
  status: 'draft' | 'published' | 'archived'
): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const current = await getPromptRevalidationInfo(id)
    if (!current) return fail('Prompt not found.')

    const update: Record<string, unknown> = { status }
    if (status === 'published' && current.published_at === null) {
      update.published_at = new Date().toISOString()
    }

    const updated = await selectOne<PromptRevalidationInfo>(
      supabase
        .from('resources')
        .update(writePayload(update))
        .eq('id', id)
        .select('slug,status,category_id,model_id,published_at')
        .single()
    )

    await revalidatePromptPublicSurfaces(current, updated)
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to change status.')
  }
}

// ---------------------------------------------------------------------------
// toggleFeatured
// ---------------------------------------------------------------------------

export async function toggleFeatured(
  id: string,
  isFeatured: boolean
): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const updated = await selectOne<PromptRevalidationInfo>(
      supabase
        .from('resources')
        .update(writePayload({ is_featured: isFeatured }))
        .eq('id', id)
        .select('slug,status,category_id,model_id,published_at')
        .single()
    )
    revalidateHomepageForPublishedPrompt(updated)
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to toggle featured.')
  }
}

// ---------------------------------------------------------------------------
// deletePrompt  (hard delete — also removes media + storage object)
// ---------------------------------------------------------------------------

export async function deletePrompt(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const current = await getPromptRevalidationInfo(id)

    // Remove the storage objects first (best-effort), then the row.
    // resource_media cascades on resource delete, but storage objects do not.
    const media = await selectMaybeOne<Pick<ResourceMediaRow, 'storage_bucket' | 'storage_path' | 'thumbnail_path'>>(
      supabase
        .from('resource_media')
        .select('storage_bucket,storage_path,thumbnail_path')
        .eq('resource_id', id)
        .maybeSingle()
    )

    if (media?.storage_bucket && media.storage_path) {
      const toRemove: string[] = [media.storage_path]
      if (media.thumbnail_path) toRemove.push(media.thumbnail_path)
      await supabase.storage.from(media.storage_bucket).remove(toRemove)
    }

    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (error) return fail(error.message)

    await revalidatePromptPublicSurfaces(current)
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to delete prompt.')
  }
}

// ---------------------------------------------------------------------------
// attachPromptImage
// ---------------------------------------------------------------------------
// Receives the raw upload, runs it through Sharp to produce:
//   - An optimized WebP full image  (max 1200 px, quality 80)
//   - A WebP thumbnail              (max 400 px,  quality 70)
// Both are stored in the resource-images bucket under separate sub-folders:
//   prompts/full/{uuid}.webp
//   prompts/thumbnails/{uuid}.webp
// The resource_media row is upserted with storage_path (full),
// thumbnail_path, dimensions (of the full image), mime_type, and file_size_bytes.
// ---------------------------------------------------------------------------

export async function attachPromptImage(
  formData: FormData
): Promise<ActionResult<{ path: string }>> {
  await guardAdmin()

  const resourceId = formData.get('resource_id')
  const file = formData.get('file')

  if (typeof resourceId !== 'string' || !resourceId) {
    return fail('Missing resource id.')
  }
  if (!(file instanceof File) || file.size === 0) {
    return fail('No image file provided.')
  }
  if (!file.type.startsWith('image/')) {
    return fail('File must be an image.')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return fail(`Image is too large. Please upload an image under ${MAX_IMAGE_LABEL}.`)
  }

  const supabase = createAdminClient()
  const bucket = STORAGE_BUCKETS.resourceImages

  try {
    // Load any existing media row so we can clean up old storage files after
    // the new upload succeeds (handles legacy paths like "{id}/cover.jpg" as
    // well as repeated re-uploads of an already-optimized image).
    const existing = await selectMaybeOne<
      Pick<ResourceMediaRow, 'storage_bucket' | 'storage_path' | 'thumbnail_path'>
    >(
      supabase
        .from('resource_media')
        .select('storage_bucket,storage_path,thumbnail_path')
        .eq('resource_id', resourceId)
        .maybeSingle()
    )

    // Process the image: produce optimized full + thumbnail WebP via Sharp.
    const arrayBuffer = await file.arrayBuffer()
    const { full, thumbnail } = await optimizeImage(arrayBuffer)

    const fullPath = `prompts/full/${resourceId}.webp`
    const thumbPath = `prompts/thumbnails/${resourceId}.webp`

    // Upload both files in parallel (upsert handles repeated uploads).
    const [fullUpload, thumbUpload] = await Promise.all([
      supabase.storage.from(bucket).upload(fullPath, full.buffer, {
        contentType: 'image/webp',
        upsert: true,
      }),
      supabase.storage.from(bucket).upload(thumbPath, thumbnail.buffer, {
        contentType: 'image/webp',
        upsert: true,
      }),
    ])

    if (fullUpload.error) return fail(`Full image upload failed: ${fullUpload.error.message}`)
    if (thumbUpload.error) return fail(`Thumbnail upload failed: ${thumbUpload.error.message}`)

    // Upsert the 1:1 media row.
    // width/height reflect the full optimized image (not the original).
    const { error: mediaError } = await supabase
      .from('resource_media')
      .upsert(
        writePayload({
          resource_id: resourceId,
          storage_path: fullPath,
          storage_bucket: bucket,
          thumbnail_path: thumbPath,
          mime_type: full.mimeType,
          file_size_bytes: full.fileSizeBytes,
          width: full.width,
          height: full.height,
          // blur_data_url is generated client-side and passed in; keep it.
          blur_data_url: (formData.get('blur_data_url') as string) || null,
        }),
        { onConflict: 'resource_id' }
      )
    if (mediaError) return fail(`Media record failed: ${mediaError.message}`)

    // Best-effort: remove old storage files that no longer match the new paths.
    // This handles legacy records (e.g. "{id}/cover.jpg") and re-uploads where
    // the path hasn't changed (Supabase upsert already overwrote the file).
    if (existing?.storage_bucket) {
      const oldBucket = existing.storage_bucket
      const staleFiles: string[] = []

      if (existing.storage_path && existing.storage_path !== fullPath) {
        staleFiles.push(existing.storage_path)
      }
      if (existing.thumbnail_path && existing.thumbnail_path !== thumbPath) {
        staleFiles.push(existing.thumbnail_path)
      }

      if (staleFiles.length > 0) {
        // Fire-and-forget — a stale file is a storage cost, not a correctness issue.
        await supabase.storage.from(oldBucket).remove(staleFiles).catch(() => {
          // Silently ignore — the UI should not fail because of a stale-file cleanup error.
        })
      }
    }

    await revalidatePromptPublicSurfaces(await getPromptRevalidationInfo(resourceId))
    return ok({ path: fullPath })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to attach image.')
  }
}

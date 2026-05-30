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
 * All actions return a typed ActionResult and revalidate affected paths.
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
import type { ResourceRow, ResourceMediaRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function revalidatePromptSurfaces(slug?: string) {
  revalidatePath('/admin/prompts')
  revalidatePath('/admin')
  revalidatePath('/') // homepage discovery grid
  if (slug) revalidatePath(`/prompt/${slug}`)
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

    revalidatePromptSurfaces(created.slug)
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
    const current = await selectMaybeOne<Pick<ResourceRow, 'status' | 'published_at' | 'slug'>>(
      supabase.from('resources').select('status,published_at,slug').eq('id', id).single()
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

    revalidatePromptSurfaces(updated.slug)
    if (current.slug !== updated.slug) revalidatePath(`/prompt/${current.slug}`)
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
    const current = await selectMaybeOne<Pick<ResourceRow, 'published_at'>>(
      supabase.from('resources').select('published_at').eq('id', id).single()
    )
    if (!current) return fail('Prompt not found.')

    const update: Record<string, unknown> = { status }
    if (status === 'published' && current.published_at === null) {
      update.published_at = new Date().toISOString()
    }

    await selectOne<ResourceRow>(
      supabase.from('resources').update(writePayload(update)).eq('id', id).select('id').single()
    )

    revalidatePromptSurfaces()
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
    await selectOne<ResourceRow>(
      supabase
        .from('resources')
        .update(writePayload({ is_featured: isFeatured }))
        .eq('id', id)
        .select('id')
        .single()
    )
    revalidatePromptSurfaces()
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
    // Remove the storage object first (best-effort), then the row.
    // resource_media cascades on resource delete, but the storage object does not.
    const media = await selectMaybeOne<Pick<ResourceMediaRow, 'storage_bucket' | 'storage_path'>>(
      supabase
        .from('resource_media')
        .select('storage_bucket,storage_path')
        .eq('resource_id', id)
        .maybeSingle()
    )

    if (media?.storage_bucket && media.storage_path) {
      await supabase.storage.from(media.storage_bucket).remove([media.storage_path])
    }

    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (error) return fail(error.message)

    revalidatePromptSurfaces()
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to delete prompt.')
  }
}

// ---------------------------------------------------------------------------
// attachPromptImage
// ---------------------------------------------------------------------------
// Uploads an image to the resource-images bucket and upserts the 1:1
// resource_media row with dimensions + blur placeholder captured client-side.
// ---------------------------------------------------------------------------

export async function attachPromptImage(
  formData: FormData
): Promise<ActionResult<{ path: string }>> {
  await guardAdmin()

  const resourceId = formData.get('resource_id')
  const file = formData.get('file')
  const width = Number(formData.get('width'))
  const height = Number(formData.get('height'))
  const blurDataUrl = (formData.get('blur_data_url') as string) || null

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
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${resourceId}/cover.${ext}`

  try {
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })
    if (uploadError) return fail(`Upload failed: ${uploadError.message}`)

    // Upsert the 1:1 media row (unique on resource_id).
    const { error: mediaError } = await supabase
      .from('resource_media')
      .upsert(
        writePayload({
          resource_id: resourceId,
          storage_path: path,
          storage_bucket: bucket,
          mime_type: file.type,
          file_size_bytes: file.size,
          width: Number.isFinite(width) && width > 0 ? width : null,
          height: Number.isFinite(height) && height > 0 ? height : null,
          blur_data_url: blurDataUrl,
        }),
        { onConflict: 'resource_id' }
      )
    if (mediaError) return fail(`Media record failed: ${mediaError.message}`)

    revalidatePromptSurfaces()
    return ok({ path })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to attach image.')
  }
}

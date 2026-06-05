'use server'

/**
 * Review moderation Server Actions — approve / reject / delete.
 *
 * Authorization: guardAdmin() on every action.
 * Data access: service-role client.
 *
 * Approving sets approved_at (DB CHECK requires it when status = approved).
 * The recompute_resource_rating trigger updates the parent resource's
 * avg_rating / review_count automatically on status change.
 */

import { revalidatePath } from 'next/cache'
import { guardAdmin } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { selectMaybeOne, selectOne, writePayload } from '@/lib/supabase/query'
import { type ActionResult, ok, fail } from '@/lib/action-result'
import type { ResourceRow, ReviewRow } from '@/types/database.types'

async function revalidateReviewSurfaces(resourceId?: string | null) {
  revalidatePath('/admin/reviews')
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/sitemap-index.xml')
  revalidatePath('/prompt/sitemap/0.xml')

  if (resourceId) {
    const supabase = createAdminClient()
    const resource = await selectMaybeOne<Pick<ResourceRow, 'slug'>>(
      supabase.from('resources').select('slug').eq('id', resourceId).maybeSingle()
    )
    if (resource?.slug) revalidatePath(`/prompt/${resource.slug}`)
  }
}

export async function approveReview(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const review = await selectOne<Pick<ReviewRow, 'id' | 'resource_id'>>(
      supabase
        .from('reviews')
        .update(
          writePayload({
            status: 'approved',
            approved_at: new Date().toISOString(),
          })
        )
        .eq('id', id)
        .select('id, resource_id')
        .single()
    )
    await revalidateReviewSurfaces(review.resource_id)
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to approve review.')
  }
}

export async function rejectReview(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const review = await selectOne<Pick<ReviewRow, 'id' | 'resource_id'>>(
      supabase
        .from('reviews')
        .update(writePayload({ status: 'rejected', approved_at: null }))
        .eq('id', id)
        .select('id, resource_id')
        .single()
    )
    await revalidateReviewSurfaces(review.resource_id)
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to reject review.')
  }
}

export async function deleteReview(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const review = await selectMaybeOne<Pick<ReviewRow, 'resource_id'>>(
      supabase.from('reviews').select('resource_id').eq('id', id).maybeSingle()
    )
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) return fail(error.message)
    await revalidateReviewSurfaces(review?.resource_id)
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to delete review.')
  }
}

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

type ReviewModerationInfo = Pick<ReviewRow, 'resource_id' | 'status'>

async function revalidateReviewedPrompt(resourceId?: string | null) {
  if (!resourceId) return

  const supabase = createAdminClient()
  const resource = await selectMaybeOne<Pick<ResourceRow, 'slug' | 'status'>>(
    supabase.from('resources').select('slug,status').eq('id', resourceId).maybeSingle()
  )

  if (resource?.status === 'published') {
    revalidatePath(`/prompt/${resource.slug}`)
  }
}

export async function approveReview(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const current = await selectMaybeOne<ReviewModerationInfo>(
      supabase.from('reviews').select('resource_id,status').eq('id', id).maybeSingle()
    )
    if (!current) return fail('Review not found.')

    await selectOne<Pick<ReviewRow, 'id'>>(
      supabase
        .from('reviews')
        .update(
          writePayload({
            status: 'approved',
            approved_at: new Date().toISOString(),
          })
        )
        .eq('id', id)
        .select('id')
        .single()
    )
    if (current.status !== 'approved') {
      await revalidateReviewedPrompt(current.resource_id)
    }
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to approve review.')
  }
}

export async function rejectReview(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const current = await selectMaybeOne<ReviewModerationInfo>(
      supabase.from('reviews').select('resource_id,status').eq('id', id).maybeSingle()
    )
    if (!current) return fail('Review not found.')

    await selectOne<Pick<ReviewRow, 'id'>>(
      supabase
        .from('reviews')
        .update(writePayload({ status: 'rejected', approved_at: null }))
        .eq('id', id)
        .select('id')
        .single()
    )
    if (current.status === 'approved') {
      await revalidateReviewedPrompt(current.resource_id)
    }
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to reject review.')
  }
}

export async function deleteReview(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const review = await selectMaybeOne<ReviewModerationInfo>(
      supabase.from('reviews').select('resource_id,status').eq('id', id).maybeSingle()
    )
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) return fail(error.message)
    if (review?.status === 'approved') {
      await revalidateReviewedPrompt(review.resource_id)
    }
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to delete review.')
  }
}

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
import { selectOne, writePayload } from '@/lib/supabase/query'
import { type ActionResult, ok, fail } from '@/lib/action-result'
import type { ReviewRow } from '@/types/database.types'

function revalidateReviewSurfaces() {
  revalidatePath('/admin/reviews')
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function approveReview(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    await selectOne<ReviewRow>(
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
    revalidateReviewSurfaces()
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to approve review.')
  }
}

export async function rejectReview(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    await selectOne<ReviewRow>(
      supabase
        .from('reviews')
        .update(writePayload({ status: 'rejected', approved_at: null }))
        .eq('id', id)
        .select('id')
        .single()
    )
    revalidateReviewSurfaces()
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to reject review.')
  }
}

export async function deleteReview(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) return fail(error.message)
    revalidateReviewSurfaces()
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to delete review.')
  }
}

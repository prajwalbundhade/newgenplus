'use server'

/**
 * Public engagement counter actions.
 *
 * Anonymous-capable. These call the SECURITY DEFINER RPCs (increment_view_count
 * / increment_copy_count) which only affect published resources and are the
 * sole sanctioned path for anonymous counter writes (ARCHITECTURE §8.2, §9.2).
 *
 * Fire-and-forget from the client; failures are swallowed so they never block
 * the copy/view UX.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { writePayload } from '@/lib/supabase/query'

export async function incrementView(resourceId: string, sessionId?: string): Promise<void> {
  if (!resourceId) return
  try {
    const supabase = createAdminClient()
    await supabase.rpc(
      'increment_view_count',
      writePayload({ p_resource_id: resourceId, p_session_id: sessionId })
    )
  } catch {
    // Best-effort analytics; never surface to the user.
  }
}

export async function incrementCopy(resourceId: string, sessionId?: string): Promise<void> {
  if (!resourceId) return
  try {
    const supabase = createAdminClient()
    await supabase.rpc(
      'increment_copy_count',
      writePayload({ p_resource_id: resourceId, p_session_id: sessionId })
    )
  } catch {
    // Best-effort.
  }
}

export async function likePrompt(resourceId: string, sessionId?: string): Promise<void> {
  if (!resourceId) return
  try {
    const supabase = createAdminClient()
    await supabase.rpc(
      'increment_like_count',
      writePayload({ p_resource_id: resourceId, p_session_id: sessionId })
    )
  } catch {
    // Best-effort.
  }
}

export async function unlikePrompt(resourceId: string): Promise<void> {
  if (!resourceId) return
  try {
    const supabase = createAdminClient()
    await supabase.rpc('decrement_like_count', writePayload({ p_resource_id: resourceId }))
  } catch {
    // Best-effort.
  }
}

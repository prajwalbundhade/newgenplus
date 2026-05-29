'use client'

/**
 * ViewTracker — records a single view per browser session per resource.
 *
 * Renders nothing. Dedupes via sessionStorage so re-renders and back/forward
 * navigation within a session don't inflate the counter (ARCHITECTURE §11.1).
 */

import { useEffect } from 'react'
import { incrementView } from '@/features/prompts/actions/counter.actions'
import { getSessionId } from '@/lib/session-id'

export function ViewTracker({ resourceId }: { resourceId: string }) {
  useEffect(() => {
    const dedupeKey = `ngp_viewed_${resourceId}`
    try {
      if (window.sessionStorage.getItem(dedupeKey)) return
      window.sessionStorage.setItem(dedupeKey, '1')
    } catch {
      // If storage is unavailable, still count once per mount.
    }
    void incrementView(resourceId, getSessionId())
  }, [resourceId])

  return null
}

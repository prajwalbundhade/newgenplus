'use client'

/**
 * ViewTracker — records a single view per browser session per resource.
 *
 * Renders nothing. Dedupes via sessionStorage so re-renders and back/forward
 * navigation within a session don't inflate the counter (ARCHITECTURE §11.1).
 * Also emits the GA `prompt_view` event (deduped the same way).
 */

import { useEffect } from 'react'
import { incrementView } from '@/features/prompts/actions/counter.actions'
import { getSessionId } from '@/lib/session-id'
import { trackPromptView } from '@/lib/analytics/gtag'

interface ViewTrackerProps {
  resourceId: string
  /** Optional metadata for the analytics event. */
  slug?: string
  title?: string
  modelName?: string | null
}

export function ViewTracker({ resourceId, slug, title, modelName }: ViewTrackerProps) {
  useEffect(() => {
    const dedupeKey = `ngp_viewed_${resourceId}`
    try {
      if (window.sessionStorage.getItem(dedupeKey)) return
      window.sessionStorage.setItem(dedupeKey, '1')
    } catch {
      // If storage is unavailable, still count once per mount.
    }
    void incrementView(resourceId, getSessionId())
    if (slug && title) {
      trackPromptView({ slug, title, model: modelName })
    }
  }, [resourceId, slug, title, modelName])

  return null
}

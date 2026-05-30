'use client'

/**
 * InfinitePromptGrid — masonry grid with infinite scroll.
 *
 * Renders the server-provided first page, then loads further pages via the
 * loadMorePrompts server action when a sentinel near the bottom enters the
 * viewport (IntersectionObserver, 600px rootMargin so it loads ahead of time).
 *
 * Masonry uses CSS columns (no JS layout lib). Resetting filters re-seeds the
 * list from the new server page via the `key`/effect on initialPrompts.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { PromptCard } from './PromptCard'
import { loadMorePrompts, type FeedFilter } from '@/features/prompts/actions/feed.actions'
import type { PromptCardVM } from '@/features/prompts/queries/prompt.queries'

interface InfinitePromptGridProps {
  initialPrompts: PromptCardVM[]
  filter: FeedFilter
  pageSize: number
}

export function InfinitePromptGrid({ initialPrompts, filter, pageSize }: InfinitePromptGridProps) {
  const [prompts, setPrompts] = useState<PromptCardVM[]>(initialPrompts)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(initialPrompts.length < pageSize)
  const sentinel = useRef<HTMLDivElement>(null)

  // Re-seed when the server sends a new first page (filter/sort changed).
  useEffect(() => {
    setPrompts(initialPrompts)
    setDone(initialPrompts.length < pageSize)
  }, [initialPrompts, pageSize])

  const loadMore = useCallback(async () => {
    if (loading || done) return
    setLoading(true)
    try {
      const next = await loadMorePrompts(filter, prompts.length, pageSize)
      setPrompts((prev) => {
        // De-dupe by id in case of overlap.
        const seen = new Set(prev.map((p) => p.id))
        const merged = [...prev, ...next.filter((p) => !seen.has(p.id))]
        return merged
      })
      if (next.length < pageSize) setDone(true)
    } catch {
      setDone(true)
    } finally {
      setLoading(false)
    }
  }, [loading, done, filter, prompts.length, pageSize])

  useEffect(() => {
    const el = sentinel.current
    if (!el || done) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore()
      },
      { rootMargin: '600px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, done])

  return (
    <div>
      <div className="columns-2 gap-3 sm:columns-2 md:columns-3 lg:columns-4 [&>*]:mb-3 sm:[&>*]:mb-4">
        {prompts.map((prompt, i) => (
          <div key={prompt.id} className="break-inside-avoid">
            <PromptCard prompt={prompt} priority={i < 5} />
          </div>
        ))}
      </div>

      {/* Sentinel + loading state */}
      {!done && (
        <div ref={sentinel} className="flex items-center justify-center py-10">
          {loading && (
            <span className="flex items-center gap-2 text-sm text-[#999999]">
              <Loader2 size={16} className="animate-spin" />
              Loading more…
            </span>
          )}
        </div>
      )}
    </div>
  )
}

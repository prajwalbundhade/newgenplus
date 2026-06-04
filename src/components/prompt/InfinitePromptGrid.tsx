'use client'

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

// Distributes items row-first across N columns
function distributeRowFirst<T>(items: T[], colCount: number): T[][] {
  const columns: T[][] = Array.from({ length: colCount }, () => [])
  items.forEach((item, i) => {
    columns[i % colCount].push(item)
  })
  return columns
}

function useColCount(ref: React.RefObject<HTMLDivElement | null>) {
  const [cols, setCols] = useState(2)
  useEffect(() => {
    if (!ref.current) return
    const update = () => {
      const w = ref.current?.offsetWidth ?? 0
      if (w >= 1024) setCols(4)
      else if (w >= 768) setCols(3)
      else setCols(2)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return cols
}

export function InfinitePromptGrid({ initialPrompts, filter, pageSize }: InfinitePromptGridProps) {
  const [prompts, setPrompts] = useState<PromptCardVM[]>(initialPrompts)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(initialPrompts.length < pageSize)
  const sentinel = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const colCount = useColCount(containerRef)

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
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...next.filter((p) => !seen.has(p.id))]
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
      (entries) => { if (entries[0]?.isIntersecting) void loadMore() },
      { rootMargin: '600px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, done])

  const columns = distributeRowFirst(prompts, colCount)

  return (
    <div>
      <div ref={containerRef} className="flex gap-3 sm:gap-4 items-start">
        {columns.map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-3 sm:gap-4">
            {col.map((prompt, i) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                priority={ci * col.length + i < 5}
              />
            ))}
          </div>
        ))}
      </div>

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
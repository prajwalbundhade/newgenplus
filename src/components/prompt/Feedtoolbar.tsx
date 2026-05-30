'use client'

/**
 * FeedToolbar
 *
 * A single horizontal bar above the prompt grid:
 *   LEFT  → "All" chip + top model chips with logos/icons
 *   RIGHT → Featured / Newest / Popular sort tabs
 *
 * Desktop only (hidden on mobile — mobile uses the bottom-sheet FilterSidebar).
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ModelIcon } from '@/components/prompt/ModelIcon'
import type { TaxonomyItem } from '@/features/taxonomy/queries/taxonomy.queries'
import type { FeedSort } from '@/features/prompts/queries/prompt.queries'

const SORTS: { key: FeedSort; label: string }[] = [
  { key: 'recent', label: 'Featured' },
  { key: 'trending', label: 'Newest' },
  { key: 'top', label: 'Popular' },
]

interface FeedToolbarProps {
  /** Top models (by relevance) to surface as quick chips. */
  topModels?: TaxonomyItem[]
  activeModel?: string
  activeSort: FeedSort
}

export function FeedToolbar({ topModels = [], activeModel, activeSort }: FeedToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) params.delete(key)
    else params.set(key, value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div className="mb-5 hidden items-center justify-between gap-4 lg:flex">

      {/* ── LEFT: All + model chips ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setParam('model', null)}
          className={cn(
            'h-8 rounded-full border px-3.5 text-sm font-medium transition-colors',
            !activeModel
              ? 'border-black bg-black text-white'
              : 'border-[#E8E3DE] bg-white text-[#333] hover:border-[#999]'
          )}
        >
          All
        </button>

        {topModels.slice(0, 4).map((model) => (
          <ModelChip
            key={model.id}
            model={model}
            active={activeModel === model.slug}
            onClick={() => setParam('model', activeModel === model.slug ? null : model.slug)}
          />
        ))}
      </div>

      {/* ── RIGHT: Sort tabs ─────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-0.5">
        {SORTS.map((s) => {
          const active = activeSort === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setParam('sort', s.key === 'recent' ? null : s.key)}
              className={cn(
                'relative h-8 rounded-full px-3.5 text-sm font-medium transition-colors',
                active ? 'bg-[#F5F0EB] text-black' : 'text-[#666] hover:text-black'
              )}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ModelChip({
  model,
  active,
  onClick,
}: {
  model: TaxonomyItem
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-full border pl-1.5 pr-3 text-sm font-medium transition-colors',
        active
          ? 'border-black bg-black text-white'
          : 'border-[#E8E3DE] bg-white text-[#333] hover:border-[#999]'
      )}
    >
      <ModelIcon name={model.name} slug={model.slug} size="sm" />
      <span>{model.name}</span>
    </button>
  )
}

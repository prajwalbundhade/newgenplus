'use client'

/**
 * FeedToolbar
 *
 * A single horizontal bar above the prompt grid:
 *   LEFT  → "All" chip + top-4 AI model chips with logos
 *   RIGHT → Featured / Newest / Popular sort tabs
 *
 * Desktop only (hidden on mobile — mobile uses the bottom-sheet FilterSidebar).
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ModelIcon, hasBrandedLogo } from '@/components/prompt/ModelIcon'
import { TaxonomyItem } from '@/features/taxonomy/queries/taxonomy.queries'
import { FeedSort } from '@/features/prompts/queries/prompt.queries'


interface FeedToolbarProps {
  topModels?: TaxonomyItem[]
  activeModel?: string
  activeSort: FeedSort
}

const SORTS = [
  { key: 'recent', label: 'Trending' },
  { key: 'trending', label: 'Newest' },
  { key: 'top', label: 'Popular' },
]
/**
 * topModels — pass the top 4 models (by prompt count) from the server.
 * Each: { id, name, slug, logoUrl? }
 */
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
    <div className="hidden lg:flex items-center justify-between gap-4 mb-5">

      {/* ── LEFT: All + model chips ─────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* All chip */}
        <button
          type="button"
          onClick={() => setParam('model', null)}
          className={cn(
            'h-8 px-3.5 rounded-full border text-[12px] font-medium transition-colors',
            !activeModel
              ? 'bg-black text-white border-black'
              : 'bg-white text-[#333] border-[#E8E3DE] hover:border-[#999]'
          )}
        >
          All
        </button>

        {/* Top model chips */}
        {topModels.slice(0, 4).map((model) => (
          <ModelChip
            key={model.id}
            model={model}
            active={activeModel === model.slug}
            onClick={() =>
              setParam('model', activeModel === model.slug ? null : model.slug)
            }
          />
        ))}
      </div>

      {/* ── RIGHT: Sort tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 shrink-0">
        {SORTS.map((s) => {
          const active = activeSort === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setParam('sort', s.key === 'recent' ? null : s.key)}
              className={cn(
                'relative h-8 px-3.5 rounded-full text-[12px] font-medium transition-colors',
                active
                  ? 'bg-[#F5F0EB] text-black'
                  : 'text-[#666] hover:text-black'
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

/* ── Model chip with logo ───────────────────────────────────────────────── */
function ModelChip({ model, active, onClick }: { model: TaxonomyItem; active: boolean; onClick: () => void }) {
  const hasLogo = hasBrandedLogo(model.name, model.slug, model.provider, model.logo_path)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 h-8 rounded-full border text-[12px] font-medium transition-colors',
        hasLogo ? 'pl-1.5 pr-3.5' : 'px-3.5',
        active
          ? 'bg-black text-white border-black'
          : 'bg-white text-[#333] border-[#E8E3DE] hover:border-[#999]'
      )}
    >
      {hasLogo && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md overflow-hidden">
          <ModelIcon name={model.name} slug={model.slug} provider={model.provider} logo_path={model.logo_path} size="sm" />
        </span>
      )}
      <span>{model.name}</span>
    </button>
  )
}
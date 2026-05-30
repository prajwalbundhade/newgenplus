'use client'

/**
 * FilterBar — sort tabs + category chips + model chips.
 *
 * Three rows:
 *   1) Sort tabs: Recent / Trending / Top Rated
 *   2) Categories: horizontal scroll on mobile
 *   3) Models: horizontal scroll on mobile
 *
 * Drives the feed via URL search params (?sort=&category=&model=) so the
 * server page re-queries. Keeps the page server-rendered while filtering stays
 * interactive without a client data layer.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ModelIcon } from '@/components/prompt/ModelIcon'
import type { TaxonomyItem } from '@/features/taxonomy/queries/taxonomy.queries'
import type { FeedSort } from '@/features/prompts/queries/prompt.queries'

interface FilterBarProps {
  categories: TaxonomyItem[]
  models: TaxonomyItem[]
  activeSort: FeedSort
  activeCategory?: string
  activeModel?: string
}

const SORTS: { key: FeedSort; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'trending', label: 'Trending' },
  { key: 'top', label: 'Top Rated' },
]

export function FilterBar({
  categories,
  models,
  activeSort,
  activeCategory,
  activeModel,
}: FilterBarProps) {
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
    <div className="space-y-3">
      {/* Row 1 — sort tabs */}
      <div className="flex items-center gap-1 border-b border-[#F0EBE5]">
        {SORTS.map((s) => {
          const active = activeSort === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setParam('sort', s.key === 'recent' ? null : s.key)}
              className={cn(
                'relative px-3 py-2 text-sm font-medium transition-colors',
                active ? 'text-[#FF6B35]' : 'text-[#666666] hover:text-[#111111]'
              )}
            >
              {s.label}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#FF6B35]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Row 2 — categories */}
      {categories.length > 0 && (
        <ChipRow ariaLabel="Categories">
          <Chip label="All" active={!activeCategory} onClick={() => setParam('category', null)} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={activeCategory === c.slug}
              onClick={() => setParam('category', c.slug)}
            />
          ))}
        </ChipRow>
      )}

      {/* Row 3 — models */}
      {models.length > 0 && (
        <ChipRow ariaLabel="AI models">
          <Chip label="All models" active={!activeModel} onClick={() => setParam('model', null)} muted />
          {models.map((m) => (
            <Chip
              key={m.id}
              label={m.name}
              active={activeModel === m.slug}
              onClick={() => setParam('model', m.slug)}
              muted
              icon={<ModelIcon name={m.name} slug={m.slug} size="sm" />}
            />
          ))}
        </ChipRow>
      )}
    </div>
  )
}

function ChipRow({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5"
    >
      {children}
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
  muted = false,
  icon,
}: {
  label: string
  active: boolean
  onClick: () => void
  muted?: boolean
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-1.5 text-sm font-medium transition-colors',
        icon ? 'pl-1.5 pr-3.5' : 'px-3.5',
        active
          ? 'bg-[#FF6B35] text-white'
          : muted
            ? 'bg-white text-[#666666] border border-[#F0EBE5] hover:border-[#FFB26B] hover:text-[#111111]'
            : 'bg-white text-[#666666] border border-[#F0EBE5] hover:border-[#FFB26B] hover:text-[#111111]'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

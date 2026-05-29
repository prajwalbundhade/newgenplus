'use client'

/**
 * DiscoveryFilters — category + sort chips for the homepage feed.
 *
 * Client Component. Updates URL search params (?category=&sort=) and lets the
 * server page re-query. Keeps the homepage server-rendered while making
 * filtering interactive without a heavy client data layer.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { TaxonomyItem } from '@/features/taxonomy/queries/taxonomy.queries'
import type { FeedSort } from '@/features/prompts/queries/prompt.queries'

interface DiscoveryFiltersProps {
  categories: TaxonomyItem[]
  activeCategory?: string
  activeSort: FeedSort
}

const SORTS: { key: FeedSort; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'trending', label: 'Trending' },
  { key: 'top', label: 'Top rated' },
]

export function DiscoveryFilters({ categories, activeCategory, activeSort }: DiscoveryFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) params.delete(key)
    else params.set(key, value)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-3">
      {/* Sort row */}
      <div className="flex items-center gap-2">
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setParam('sort', s.key === 'recent' ? null : s.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              activeSort === s.key
                ? 'bg-[#FF6B35] text-white'
                : 'bg-white text-[#666666] border border-[#F0EBE5] hover:border-[#FFB26B] hover:text-[#111111]'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            label="All"
            active={!activeCategory}
            onClick={() => setParam('category', null)}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={activeCategory === c.slug}
              onClick={() => setParam('category', c.slug)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-[#FFF0E8] text-[#FF6B35] border border-[#FFB26B]'
          : 'bg-white text-[#666666] border border-[#F0EBE5] hover:border-[#E5DDD6] hover:text-[#111111]'
      )}
    >
      {label}
    </button>
  )
}

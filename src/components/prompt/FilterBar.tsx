'use client'

/**
 * FilterSidebar
 *
 * Desktop  → fixed left sidebar (white, black text)
 * Mobile   → sticky bottom bar with a filter icon that opens a bottom sheet
 *
 * Drop-in replacement for FilterBar. Same props, same URL-param logic.
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaxonomyItem } from '@/features/taxonomy/queries/taxonomy.queries'
import type { FeedSort } from '@/features/prompts/queries/prompt.queries'

interface FilterSidebarProps {
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

export function FilterSidebar({
  categories,
  models,
  activeSort,
  activeCategory,
  activeModel,
}: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // mobile bottom-sheet open state
  const [sheetOpen, setSheetOpen] = useState(false)

  // close sheet on route change
  useEffect(() => { setSheetOpen(false) }, [searchParams])

  // lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) params.delete(key)
    else params.set(key, value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const activeCount =
    (activeSort !== 'recent' ? 1 : 0) +
    (activeCategory ? 1 : 0) +
    (activeModel ? 1 : 0)

  const filterContent = (
    <FilterPanelContent
      categories={categories}
      models={models}
      activeSort={activeSort}
      activeCategory={activeCategory}
      activeModel={activeModel}
      setParam={setParam}
    />
  )

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-56 xl:w-60 shrink-0">
        <div className="sticky top-20 rounded-xl border border-[#E8E3DE] bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-black">
            Filters
          </p>
          {filterContent}
        </div>
      </aside>

      {/* ─── MOBILE BOTTOM BAR ───────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex justify-center pb-5 pointer-events-none">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-semibold text-white shadow-lg active:scale-95 transition-transform"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B35] text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── MOBILE BOTTOM SHEET ─────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setSheetOpen(false)}
        className={cn(
          'lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Sheet panel */}
      <div
        className={cn(
          'lg:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out',
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ maxHeight: '80vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[#E0DAD4]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0EBE5]">
          <p className="text-base font-bold text-black">Filters</p>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="rounded-full p-1.5 hover:bg-[#F5F0EB] transition-colors"
          >
            <X size={18} className="text-black" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {filterContent}
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Shared panel content (used in both sidebar and sheet)
───────────────────────────────────────────────────────────────────────────── */

interface PanelProps {
  categories: TaxonomyItem[]
  models: TaxonomyItem[]
  activeSort: FeedSort
  activeCategory?: string
  activeModel?: string
  setParam: (key: string, value: string | null) => void
}

function FilterPanelContent({
  categories,
  models,
  activeSort,
  activeCategory,
  activeModel,
  setParam,
}: PanelProps) {
  return (
    <div className="space-y-6">

      {/* Categories */}
      {categories.length > 0 && (
        <FilterSection title="Category">
          <div className="flex flex-col gap-1">
            <ChipButton
              label="All"
              active={!activeCategory}
              onClick={() => setParam('category', null)}
            />
            {categories.map((c) => (
              <ChipButton
                key={c.id}
                label={c.name}
                active={activeCategory === c.slug}
                onClick={() => setParam('category', c.slug)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Models */}
      {models.length > 0 && (
        <FilterSection title="AI Model">
          <div className="flex flex-col gap-1">
            <ChipButton
              label="All models"
              active={!activeModel}
              onClick={() => setParam('model', null)}
            />
            {models.map((m) => (
              <ChipButton
                key={m.id}
                label={m.name}
                active={activeModel === m.slug}
                onClick={() => setParam('model', m.slug)}
              />
            ))}
          </div>
        </FilterSection>
      )}

    </div>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-2 flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-black"
      >
        {title}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && children}
    </div>
  )
}

function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left',
        active
          ? 'bg-black text-white'
          : 'text-[#333333] hover:bg-[#F5F0EB]'
      )}
    >
      {label}
    </button>
  )
}
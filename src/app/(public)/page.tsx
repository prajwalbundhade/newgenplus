/**
 * Homepage — / (discovery surface)
 *
 * Layout (desktop):
 *   [Intro headline]
 *   [3 Promo banners]
 *   ┌──────────────┬────────────────────────────────────┐
 *   │  Sidebar     │  FeedToolbar (model chips + sort)  │
 *   │  (filters)   │  InfinitePromptGrid                │
 *   └──────────────┴────────────────────────────────────┘
 *
 * Layout (mobile):
 *   [Intro] [Banners] [Full-width grid] [Sticky bottom filter button]
 */

import { Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import {
  listPublishedPrompts,
  type FeedSort,
} from '@/features/prompts/queries/prompt.queries'
import {
  listPublishedCategories,
  listPublishedModels,
} from '@/features/taxonomy/queries/taxonomy.queries'
import { PromoBanners } from '@/components/prompt/PromptBanner'
import { FilterSidebar } from '@/components/prompt/FilterBar'
import { FeedToolbar } from '@/components/prompt/Feedtoolbar'
import { InfinitePromptGrid } from '@/components/prompt/InfinitePromptGrid'
import { EmptyState } from '@/components/admin/EmptyState'

export const revalidate = 60
const PAGE_SIZE = 24

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description: siteConfig.description,
  alternates: { canonical: '/' },
}

function parseSort(value?: string): FeedSort {
  return value === 'trending' || value === 'top' ? value : 'recent'
}

interface HomePageProps {
  searchParams: Promise<{ category?: string; model?: string; sort?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category, model, sort } = await searchParams
  const activeSort = parseSort(sort)

  const [categories, models, firstPage] = await Promise.all([
    listPublishedCategories(),
    listPublishedModels(),
    listPublishedPrompts({
      sort: activeSort,
      categorySlug: category,
      modelSlug: model,
      limit: PAGE_SIZE,
    }),
  ])

  // Top models for the toolbar. promptCount isn't fetched on the lightweight
  // TaxonomyItem, so we simply take the first four (already name-ordered).
  const topModels = models.slice(0, 4)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

      {/* Intro */}
      {/* Intro + Promo banners — shared white card */}
      <section className="mb-8 rounded-3xl border border-[#E8E3DE] bg-white px-4 pt-4 pb-5 sm:px-5 shadow-sm">
        <h1 className="mb-4 text-lg font-bold tracking-tight text-[#111111] sm:text-xl">
          Discover &amp; copy the best AI prompts
        </h1>
        <PromoBanners />
      </section>

      {/* Two-column layout */}
      <div className="flex items-start gap-6">

        {/* Left sidebar — desktop */}
        <FilterSidebar
          categories={categories}
          models={models}
          activeSort={activeSort}
          activeCategory={category}
          activeModel={model}
        />

        {/* Right: toolbar + grid */}
        <div className="min-w-0 flex-1 rounded-3xl border border-[#E8E3DE] bg-white p-4 sm:p-6 shadow-sm">
          <FeedToolbar
            topModels={topModels}
            activeModel={model}
            activeSort={activeSort}
          />

          {firstPage.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No prompts to show yet"
              description="Published prompts will appear here as soon as they're added."
            />
          ) : (
            <InfinitePromptGrid
              key={`${activeSort}:${category ?? 'all'}:${model ?? 'all'}`}
              initialPrompts={firstPage}
              filter={{ sort: activeSort, categorySlug: category, modelSlug: model }}
              pageSize={PAGE_SIZE}
            />
          )}
        </div>

      </div>

      {/* Mobile bottom padding for sticky filter button */}
      <div className="h-20 lg:hidden" />

    </div >
  )
}
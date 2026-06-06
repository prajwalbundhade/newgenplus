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

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { buildMetadata } from '@/lib/seo/metadata'
import {
  listPublishedPrompts,
  type FeedSort,
} from '@/features/prompts/queries/prompt.queries'
import {
  listPublishedCategories,
  listPublishedModels,
  listTopModelsByPromptCount
} from '@/features/taxonomy/queries/taxonomy.queries'
import { PromoBanners } from '@/components/prompt/PromptBanner'
import { FilterSidebar } from '@/components/prompt/FilterBar'
import { FeedToolbar } from '@/components/prompt/Feedtoolbar'
import { InfinitePromptGrid } from '@/components/prompt/InfinitePromptGrid'
import { EmptyState } from '@/components/admin/EmptyState'

export const revalidate = 3660
const PAGE_SIZE = 24

// The homepage is the canonical root. Filter/sort params (?category, ?model,
// ?sort) never change the canonical, so all filtered permutations consolidate
// to `/` for indexing.
export const metadata: Metadata = buildMetadata({
  absoluteTitle: `${siteConfig.name} - ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: routes.home,
})

function parseSort(value?: string): FeedSort {
  return value === 'trending' || value === 'top' ? value : 'recent'
}

interface HomePageProps {
  searchParams: Promise<{ category?: string; model?: string; sort?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category, model, sort } = await searchParams
  const activeSort = parseSort(sort)

  const [categories, models, firstPage, topModels] = await Promise.all([
    listPublishedCategories(),
    listPublishedModels(),
    listPublishedPrompts({
      sort: activeSort,
      categorySlug: category,
      modelSlug: model,
      limit: PAGE_SIZE,
    }),
    listTopModelsByPromptCount(4),
  ]);


  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-1 sm:px-6 lg:px-8">

      {/* Intro */}
      {/* Intro + Promo banners — shared white card */}
      <section className="mb-8 rounded-3xl border border-[#E8E3DE] bg-white px-4 pt-4 pb-5 sm:px-5 shadow-sm">
        <h1 className="mb-4 text-lg font-bold tracking-tight text-[#111111] sm:text-xl">
          Discover &amp; copy the best AI prompts
        </h1>
        <p className="mb-4 hidden sm:block max-w-3xl lg:max-w-4xl text-xs sm:text-sm leading-6 text-[#666666]">
          {siteConfig.name} is a curated prompt discovery platform for creators
          comparing models, categories, tags, preview images, prompt text,
          ratings, and related examples before copying.
        </p>
        <div className="mb-4 relative">
          <div className="flex gap-2 overflow-x-auto flex-nowrap sm:flex-wrap sm:overflow-x-visible pb-1 sm:pb-0 scrollbar-none">
            {categories.slice(0, 6).map((item) => (
              <Link
                key={item.slug}
                href={routes.category(item.slug)}
                className="shrink-0 rounded-full border border-[#E8E3DE] bg-[#FFFCFA] px-3 py-1 text-xs font-medium text-[#666666] hover:border-[#FFB26B] hover:text-[#111111]"
              >
                {item.name}
              </Link>
            ))}
            {topModels.slice(0, 4).map((item) => (
              <Link
                key={item.slug}
                href={routes.model(item.slug)}
                className="shrink-0 rounded-full border border-[#DCE5F2] bg-[#F7FAFE] px-3 py-1 text-xs font-medium text-[#4B6B93] hover:border-[#BFD0E6] hover:text-[#111111]"
              >
                {item.name}
              </Link>
            ))}
          </div>
          {/* scroll hint fade — mobile only */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent sm:hidden" />
        </div>
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

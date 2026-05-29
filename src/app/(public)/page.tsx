/**
 * Homepage — / (discovery surface)
 *
 * Image-first. A one-line intro sits above a large featured carousel, the
 * filter bar (sort + categories + models), and the infinite masonry feed.
 * Content dominates; branding is a single headline. Filtering is driven by URL
 * search params and re-queried server-side; the grid paginates client-side.
 */

import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { siteConfig } from '@/config/site'
import {
  listPublishedPrompts,
  listFeaturedPrompts,
  type FeedSort,
} from '@/features/prompts/queries/prompt.queries'
import {
  listPublishedCategories,
  listPublishedModels,
} from '@/features/taxonomy/queries/taxonomy.queries'
import { FeaturedCarousel } from '@/components/prompt/FeaturedCarousel'
import { FilterBar } from '@/components/prompt/FilterBar'
import { InfinitePromptGrid } from '@/components/prompt/InfinitePromptGrid'
import { EmptyState } from '@/components/admin/EmptyState'

export const revalidate = 60

const PAGE_SIZE = 24

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description: siteConfig.description,
  alternates: { canonical: '/' },
}

interface HomePageProps {
  searchParams: Promise<{ category?: string; model?: string; sort?: string }>
}

function parseSort(value?: string): FeedSort {
  return value === 'trending' || value === 'top' ? value : 'recent'
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category, model, sort } = await searchParams
  const activeSort = parseSort(sort)
  const isFiltered = Boolean(category || model)

  const [categories, models, featured, firstPage] = await Promise.all([
    listPublishedCategories(),
    listPublishedModels(),
    // Featured only on the default, unfiltered view.
    isFiltered ? Promise.resolve([]) : listFeaturedPrompts(12),
    listPublishedPrompts({
      sort: activeSort,
      categorySlug: category,
      modelSlug: model,
      limit: PAGE_SIZE,
    }),
  ])

  const showFeatured = !isFiltered && featured.length > 0

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

      {/* Tiny intro */}
      <div className="mb-6">
        <h1 className="text-lg font-bold tracking-tight text-[#111111] sm:text-xl">
          Discover &amp; copy the best AI prompts
        </h1>
      </div>

      {/* Featured */}
      {showFeatured && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={15} className="text-[#FF6B35]" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#999999]">
              Featured
            </h2>
          </div>
          <FeaturedCarousel prompts={featured} />
        </section>
      )}

      {/* Filters */}
      <section className="mb-6">
        <FilterBar
          categories={categories}
          models={models}
          activeSort={activeSort}
          activeCategory={category}
          activeModel={model}
        />
      </section>

      {/* Main feed */}
      <section>
        {firstPage.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No prompts to show yet"
            description="Published prompts will appear here as soon as they're added."
          />
        ) : (
          <InfinitePromptGrid
            // Re-mount when filters change so the grid re-seeds cleanly.
            key={`${activeSort}:${category ?? 'all'}:${model ?? 'all'}`}
            initialPrompts={firstPage}
            filter={{ sort: activeSort, categorySlug: category, modelSlug: model }}
            pageSize={PAGE_SIZE}
          />
        )}
      </section>
    </div>
  )
}

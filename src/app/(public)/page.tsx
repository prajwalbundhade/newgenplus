/**
 * Homepage — / (discovery surface)
 *
 * Image-first. A compact hero strip sits above a featured row and the main
 * masonry feed. Content dominates; branding/nav are minimal. Filtering and
 * sorting are driven by URL search params and re-queried server-side.
 *
 * ISR: revalidated on a short interval and on-demand by admin mutations
 * (revalidatePath('/')).
 */

import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { siteConfig } from '@/config/site'
import {
  listPublishedPrompts,
  listFeaturedPrompts,
  type FeedSort,
} from '@/features/prompts/queries/prompt.queries'
import { listPublishedCategories } from '@/features/taxonomy/queries/taxonomy.queries'
import { PromptGrid } from '@/components/prompt/PromptGrid'
import { DiscoveryFilters } from '@/components/prompt/DiscoveryFilters'
import { EmptyState } from '@/components/admin/EmptyState'

export const revalidate = 60

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description: siteConfig.description,
  alternates: { canonical: '/' },
}

interface HomePageProps {
  searchParams: Promise<{ category?: string; sort?: string }>
}

function parseSort(value?: string): FeedSort {
  return value === 'trending' || value === 'top' ? value : 'recent'
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category, sort } = await searchParams
  const activeSort = parseSort(sort)

  const [categories, featured, prompts] = await Promise.all([
    listPublishedCategories(),
    // Featured only shown on the default (unfiltered) view.
    category ? Promise.resolve([]) : listFeaturedPrompts(10),
    listPublishedPrompts({ sort: activeSort, categorySlug: category, limit: 60 }),
  ])

  const showFeatured = !category && featured.length > 0

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Compact hero strip */}
      <section className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F0EBE5] bg-white px-3 py-1 text-xs font-medium text-[#FF6B35]">
          <Sparkles size={12} className="fill-[#FF6B35]" />
          Free, curated AI prompts
        </span>
        <h1 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
          Discover &amp; copy the best AI prompts
        </h1>
      </section>

      {/* Featured row */}
      {showFeatured && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#999999]">
            Featured
          </h2>
          <PromptGrid prompts={featured} />
        </section>
      )}

      {/* Filters + main feed */}
      <section>
        <div className="mb-5">
          <DiscoveryFilters
            categories={categories}
            activeCategory={category}
            activeSort={activeSort}
          />
        </div>

        {prompts.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No prompts to show yet"
            description="Published prompts will appear here as soon as they're added."
          />
        ) : (
          <PromptGrid prompts={prompts} />
        )}
      </section>
    </div>
  )
}

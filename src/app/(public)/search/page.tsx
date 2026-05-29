/**
 * Search results — /search?q=
 *
 * Dynamic (query-dependent). Backed by the Postgres full-text search_vector
 * index. Integrated into the discovery experience: same card grid.
 */

import type { Metadata } from 'next'
import { Search as SearchIcon } from 'lucide-react'
import { searchPublishedPrompts } from '@/features/prompts/queries/prompt.queries'
import { PromptGrid } from '@/components/prompt/PromptGrid'
import { SearchBar } from '@/components/prompt/SearchBar'
import { EmptyState } from '@/components/admin/EmptyState'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Search',
  description: `Search the ${siteConfig.name} prompt library.`,
  robots: { index: false, follow: true },
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const term = (q ?? '').trim()
  const results = term ? await searchPublishedPrompts(term) : []

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 max-w-xl">
        <h1 className="mb-4 text-center text-2xl font-bold tracking-tight text-[#111111]">
          Search prompts
        </h1>
        <SearchBar initialQuery={term} autoFocus />
      </div>

      {term === '' ? (
        <EmptyState
          icon={SearchIcon}
          title="Search the library"
          description="Find prompts by title, description, or keywords."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={`No results for “${term}”`}
          description="Try a different keyword or broaden your search."
        />
      ) : (
        <>
          <p className="mb-5 text-sm text-[#666666]">
            {results.length} {results.length === 1 ? 'result' : 'results'} for{' '}
            <span className="font-medium text-[#111111]">“{term}”</span>
          </p>
          <PromptGrid prompts={results} />
        </>
      )}
    </div>
  )
}

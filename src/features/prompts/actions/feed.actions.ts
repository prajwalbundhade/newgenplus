'use server'

/**
 * Public feed pagination action.
 *
 * Server action used by the client InfinitePromptGrid to fetch the next page
 * of the discovery feed. Reuses the same query layer as the server-rendered
 * first page, so filters/sort stay consistent. Anonymous-capable, read-only.
 */

import {
  listPublishedPrompts,
  type PromptCardVM,
  type FeedSort,
} from '@/features/prompts/queries/prompt.queries'

export interface FeedFilter {
  sort: FeedSort
  categorySlug?: string
  modelSlug?: string
}

export async function loadMorePrompts(
  filter: FeedFilter,
  offset: number,
  limit = 24
): Promise<PromptCardVM[]> {
  return listPublishedPrompts({
    sort: filter.sort,
    categorySlug: filter.categorySlug,
    modelSlug: filter.modelSlug,
    offset,
    limit,
  })
}

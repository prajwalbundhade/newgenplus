/**
 * PromptGrid — responsive masonry layout via CSS columns.
 *
 * Server Component. CSS columns give a true Pinterest-style masonry with zero
 * JS and no layout library. Used by static/ISR pages (category, model, search,
 * similar). The homepage uses InfinitePromptGrid for pagination.
 */

import { PromptCard } from './PromptCard'
import type { PromptCardVM } from '@/features/prompts/queries/prompt.queries'

export function PromptGrid({ prompts }: { prompts: PromptCardVM[] }) {
  return (
    <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5">
      {prompts.map((prompt) => (
        <div key={prompt.id} className="mb-3 break-inside-avoid sm:mb-4">
          <PromptCard prompt={prompt} />
        </div>
      ))}
    </div>
  )
}

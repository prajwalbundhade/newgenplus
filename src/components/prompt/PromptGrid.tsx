/**
 * PromptGrid — responsive masonry layout via CSS columns.
 *
 * Server Component. CSS columns give a true Pinterest-style masonry with zero
 * JS and no layout library (ARCHITECTURE §14). Cards use break-inside-avoid.
 */

import { PromptCard } from './PromptCard'
import type { PromptCardVM } from '@/features/prompts/queries/prompt.queries'

export function PromptGrid({ prompts }: { prompts: PromptCardVM[] }) {
  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5 [&>*]:mb-4">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  )
}

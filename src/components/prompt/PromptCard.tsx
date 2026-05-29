/**
 * PromptCard — a single discovery card.
 *
 * Server-renderable. Image-first, Pinterest-style. Uses stored dimensions to
 * reserve aspect ratio (no CLS) and the blur placeholder for instant load.
 * The whole card links to the detail page. Title, model, views and copies are
 * always visible below the image; a richer overlay appears on hover.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Copy, Eye, Sparkles } from 'lucide-react'
import { routes } from '@/config/routes'
import { formatCount } from '@/lib/utils'
import type { PromptCardVM } from '@/features/prompts/queries/prompt.queries'

export function PromptCard({ prompt, priority = false }: { prompt: PromptCardVM; priority?: boolean }) {
  const aspectRatio =
    prompt.width && prompt.height ? `${prompt.width} / ${prompt.height}` : '4 / 5'

  return (
    <Link
      href={routes.prompt(prompt.slug)}
      className="group block overflow-hidden rounded-xl border border-[#F0EBE5] bg-white transition-shadow duration-200 hover:shadow-[0_8px_30px_-8px_rgb(0_0_0/0.18)]"
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-[#FFF9F5]" style={{ aspectRatio }}>
        {prompt.imageUrl ? (
          <Image
            src={prompt.imageUrl}
            alt={prompt.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            {...(prompt.blurDataUrl
              ? { placeholder: 'blur' as const, blurDataURL: prompt.blurDataUrl }
              : {})}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles size={28} className="text-[#E5DDD6]" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111111]/60 via-[#111111]/0 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 p-3 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex items-center gap-1 text-xs font-semibold">
            <Copy size={12} />
            {formatCount(prompt.copyCount)}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold">
            <Eye size={12} />
            {formatCount(prompt.viewCount)}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-medium text-[#111111]">{prompt.title}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-[#999999]">
            {prompt.modelName ?? prompt.creatorName}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-[#999999]">
            <span className="flex items-center gap-0.5">
              <Copy size={11} />
              {formatCount(prompt.copyCount)}
            </span>
            <span className="flex items-center gap-0.5">
              <Eye size={11} />
              {formatCount(prompt.viewCount)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

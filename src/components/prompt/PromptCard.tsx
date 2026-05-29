/**
 * PromptCard — a single discovery card.
 *
 * Server Component. Image-first, Pinterest-style. Uses stored dimensions to
 * reserve aspect ratio (no CLS) and the blur placeholder for instant load.
 * The whole card links to the detail page.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Copy, Eye, Sparkles } from 'lucide-react'
import { routes } from '@/config/routes'
import { formatCount } from '@/lib/utils'
import type { PromptCardVM } from '@/features/prompts/queries/prompt.queries'

export function PromptCard({ prompt }: { prompt: PromptCardVM }) {
  const aspectRatio =
    prompt.width && prompt.height ? `${prompt.width} / ${prompt.height}` : '4 / 5'

  return (
    <Link
      href={routes.prompt(prompt.slug)}
      className="group mb-4 block break-inside-avoid overflow-hidden rounded-xl border border-[#F0EBE5] bg-white transition-shadow duration-200 hover:shadow-[0_8px_30px_-8px_rgb(0_0_0/0.15)]"
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-[#FFF9F5]" style={{ aspectRatio }}>
        {prompt.imageUrl ? (
          <Image
            src={prompt.imageUrl}
            alt={prompt.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            {...(prompt.blurDataUrl
              ? { placeholder: 'blur' as const, blurDataURL: prompt.blurDataUrl }
              : {})}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles size={28} className="text-[#E5DDD6]" />
          </div>
        )}

        {/* Hover overlay with stats */}
        <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-[#111111]/55 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex w-full items-center gap-3 p-3 text-white">
            <span className="flex items-center gap-1 text-xs font-medium">
              <Copy size={12} />
              {formatCount(prompt.copyCount)}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium">
              <Eye size={12} />
              {formatCount(prompt.viewCount)}
            </span>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-medium text-[#111111]">{prompt.title}</h3>
        <p className="mt-0.5 text-xs text-[#999999]">{prompt.creatorName}</p>
      </div>
    </Link>
  )
}

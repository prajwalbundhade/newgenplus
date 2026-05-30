'use client'

/**
 * FeaturedCarousel — horizontal, swipeable row of large featured cards.
 *
 * Mobile: native horizontal scroll with snap. Desktop: prev/next arrows that
 * scroll by one viewport. Dominates the first screen visually.
 */

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Copy, Eye, Heart, Sparkles } from 'lucide-react'
import { routes } from '@/config/routes'
import { formatCount } from '@/lib/utils'
import type { PromptCardVM } from '@/features/prompts/queries/prompt.queries'

export function FeaturedCarousel({ prompts }: { prompts: PromptCardVM[] }) {
  const scroller = useRef<HTMLDivElement>(null)

  function scrollBy(direction: 1 | -1) {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.85), behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {/* Desktop arrows */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#F0EBE5] bg-white text-[#666666] shadow-md transition-colors hover:text-[#FF6B35] lg:flex"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#F0EBE5] bg-white text-[#666666] shadow-md transition-colors hover:text-[#FF6B35] lg:flex"
      >
        <ChevronRight size={18} />
      </button>

      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
      >
        {prompts.map((prompt, i) => (
          <FeaturedCard key={prompt.id} prompt={prompt} priority={i < 3} />
        ))}
      </div>
    </div>
  )
}

function FeaturedCard({ prompt, priority }: { prompt: PromptCardVM; priority: boolean }) {
  return (
    <Link
      href={routes.prompt(prompt.slug)}
      className="group relative aspect-[4/3] w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#F0EBE5] bg-[#FFF9F5] sm:w-[52%] lg:w-[32%]"
    >
      {prompt.imageUrl ? (
        <Image
          src={prompt.imageUrl}
          alt={prompt.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 52vw, 32vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          {...(prompt.blurDataUrl
            ? { placeholder: 'blur' as const, blurDataURL: prompt.blurDataUrl }
            : {})}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Sparkles size={32} className="text-[#E5DDD6]" />
        </div>
      )}

      {/* Caption overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/75 via-[#111111]/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="line-clamp-1 text-base font-semibold">{prompt.title}</h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-white/85">
          {prompt.modelName && <span className="truncate">{prompt.modelName}</span>}
          <span className="flex items-center gap-1">
            <Copy size={11} />
            {formatCount(prompt.copyCount)}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {formatCount(prompt.viewCount)}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} />
            {formatCount(prompt.likeCount)}
          </span>
        </div>
      </div>
    </Link>
  )
}

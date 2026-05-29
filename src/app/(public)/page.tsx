/**
 * Homepage — /
 *
 * Phase 1.0 ships the branded hero and value proposition. The visual
 * discovery grid (masonry + infinite scroll) is added in Phase 1.2 directly
 * below the hero, reusing this same route.
 */

import Link from 'next/link'
import { Search, Copy, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  // Homepage uses the site name as an absolute title (no template suffix).
  title: {
    absolute: `${siteConfig.name} — ${siteConfig.tagline}`,
  },
  description: siteConfig.description,
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center py-20 text-center sm:py-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F0EBE5] bg-white px-3 py-1 text-xs font-medium text-[#FF6B35]">
          <Zap size={12} className="fill-[#FF6B35]" />
          Free, curated AI prompts
        </span>

        <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[#111111] sm:text-5xl lg:text-6xl">
          Discover &amp; copy the best{' '}
          <span className="text-[#FF6B35]">AI prompts</span>
        </h1>

        <p className="mt-5 max-w-xl text-base text-[#666666] sm:text-lg">
          {siteConfig.description}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href={routes.search()}
            className={buttonVariants({ variant: 'primary', size: 'xl' })}
          >
            <Search size={16} />
            Start exploring
          </Link>
        </div>
      </section>

      {/* ── Value props ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-3">
        <ValueProp
          icon={<Search size={18} className="text-[#FF6B35]" />}
          title="Discover visually"
          body="Browse a Pinterest-style grid of high-quality prompts across categories and models."
        />
        <ValueProp
          icon={<Copy size={18} className="text-[#FF6B35]" />}
          title="Copy instantly"
          body="One click copies the full prompt. No sign-up, no friction — just paste and create."
        />
        <ValueProp
          icon={<Zap size={18} className="text-[#FF6B35]" />}
          title="Always curated"
          body="Every prompt is hand-reviewed for quality, tagged by model, and kept current."
        />
      </section>
    </div>
  )
}

function ValueProp({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-[#F0EBE5] bg-white p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0E8]">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold text-[#111111]">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[#666666]">{body}</p>
    </div>
  )
}

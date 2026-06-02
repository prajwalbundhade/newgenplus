/**
 * PublicHeader — sticky top navigation for the public site.
 *
 * Design: Warm Ivory + Tangerine (Option B)
 * Fonts:  Syne (logo) · DM Sans (nav/body) — add to your layout/globals
 *
 * Layout: [logo]  ·  Explore / Search (center, desktop)  ·  [search input] + [feedback btn] (right)
 */

import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { primaryNav } from '@/config/navigation'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { SearchBar } from '@/components/prompt/SearchBar'
import { FeedbackButton } from '@/components/feedback/FeedbackButton'
import { HeaderWrapper } from './HeaderWrapper'

export function PublicHeader() {
  return (
    <HeaderWrapper>

      {/* ── Left — brand ── */}
      <Link
        href={routes.home}
        className="flex shrink-0 items-center gap-2.5 no-underline"
      >
        <span
          className="flex h-[33px] w-[33px] items-center justify-center rounded-[9px] bg-[#FF6B35]"
          style={{ boxShadow: '0 3px 10px rgba(255,107,53,0.38)' }}
        >
          <BrandIcon size={19} />
        </span>
        <span
          className="hidden text-[15.5px] tracking-[-0.4px] text-[#13100E] sm:inline"
          style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
        >
          {siteConfig.name}
        </span>
      </Link>

      {/* ── Center — primary nav (desktop) ── */}
      <nav className="ml-2 hidden items-center gap-0.5 md:flex">
        {primaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="
                rounded-lg px-[13px] py-1.5 text-[13.5px] font-medium
                text-[#7A6F69] no-underline transition-colors
                hover:bg-[#F2EBE4] hover:text-[#13100E]
              "
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* ── Right — search + feedback ── */}
      <div className="ml-auto flex items-center gap-2.5">

        {/* Search input */}
        <div className="w-full max-w-[215px]">
          <SearchBar variant="compact" />
        </div>

        {/* Feedback button + modal */}
        <FeedbackButton />

      </div>
    </HeaderWrapper>
  )
}

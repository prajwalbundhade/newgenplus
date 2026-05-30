/**
 * PublicHeader — sticky top navigation for the public site.
 *
 * Design: Warm Ivory + Tangerine (Option B)
 * Fonts:  Syne (logo) · DM Sans (nav/body) — add to your layout/globals
 *
 * Layout: [logo]  ·  Explore / Search (center, desktop)  ·  [search input] + [feedback btn] (right)
 */

import Link from 'next/link'
import { Sparkles, MessageCircle } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { primaryNav } from '@/config/navigation'
import { SearchBar } from '@/components/prompt/SearchBar'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 px-4 py-3 sm:px-6 lg:px-8">
      <div
        className="
    mx-auto flex h-[62px] w-full max-w-7xl items-center gap-4
    rounded-[14px]
    border border-[#E5D8CF]
    bg-[#FFF]
    shadow-[0_2px_10px_rgba(0,0,0,0.04)]
    px-6
  "
      >

        {/* ── Left — brand ── */}
        <Link
          href={routes.home}
          className="flex shrink-0 items-center gap-2.5 no-underline"
        >
          <span
            className="flex h-[33px] w-[33px] items-center justify-center rounded-[9px] bg-[#FF6B35]"
            style={{ boxShadow: '0 3px 10px rgba(255,107,53,0.38)' }}
          >
            <Sparkles size={15} className="text-white" />
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

          {/* Feedback button */}
          <Link
            href=""
            className="
              group hidden shrink-0 items-center gap-1.5 whitespace-nowrap
              rounded-[10px] border-[1.5px] border-[#D9CFC7] bg-white
              px-[15px] text-[13px] font-medium text-[#4A3F3A] no-underline
              transition-colors hover:border-[#FF6B35] hover:bg-[#FFF6F2]
              hover:text-[#FF6B35] sm:flex
            "
            style={{ height: 37 }}
          >
            <MessageCircle
              size={15}
              className="text-[#FF6B35] transition-colors"
            />
            Give feedback
          </Link>

        </div>
      </div>
    </header>
  )
}
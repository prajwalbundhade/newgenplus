/**
 * PublicHeader — top navigation for the public site.
 *
 * Server Component. Static, fast, no client JS. Sticky, light theme,
 * uses brand tokens and the central route/navigation config.
 */

import Link from 'next/link'
import { Sparkles, Search } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { primaryNav } from '@/config/navigation'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#F0EBE5] bg-[#FFF9F5]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <Link href={routes.home} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]">
            <Sparkles size={16} className="text-white" />
          </span>
          <span className="text-base font-bold tracking-tight text-[#111111]">
            {siteConfig.name}
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#666666] transition-colors hover:bg-white hover:text-[#111111]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search affordance */}
        <Link
          href={routes.search()}
          className="flex items-center gap-2 rounded-lg border border-[#F0EBE5] bg-white px-3 py-2 text-sm text-[#999999] transition-colors hover:border-[#E5DDD6] hover:text-[#666666]"
          aria-label="Search prompts"
        >
          <Search size={15} />
          <span className="hidden md:inline">Search prompts…</span>
        </Link>
      </div>
    </header>
  )
}

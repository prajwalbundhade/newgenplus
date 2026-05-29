/**
 * PublicHeader — sticky top navigation for the public site.
 *
 * Layout: [logo]  ·  Explore / Search (center, desktop)  ·  [search input] (right).
 * The search input is always visible, including on mobile, per the
 * discovery-first product direction.
 */

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { primaryNav } from '@/config/navigation'
import { SearchBar } from '@/components/prompt/SearchBar'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#F0EBE5] bg-[#FFF9F5]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:h-16 sm:gap-6 sm:px-6 lg:px-8">

        {/* Left — brand */}
        <Link href={routes.home} className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]">
            <Sparkles size={16} className="text-white" />
          </span>
          <span className="hidden text-base font-bold tracking-tight text-[#111111] sm:inline">
            {siteConfig.name}
          </span>
        </Link>

        {/* Center — primary nav (desktop) */}
        <nav className="hidden items-center gap-1 md:flex">
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

        {/* Right — global search (always visible, flexes to fill) */}
        <div className="ml-auto w-full max-w-md">
          <SearchBar variant="compact" />
        </div>
      </div>
    </header>
  )
}

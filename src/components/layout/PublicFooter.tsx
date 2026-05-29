/**
 * PublicFooter — site footer for the public experience.
 *
 * Server Component. Renders link columns from the navigation config.
 * Light theme, brand tokens, no client JS.
 */

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { footerNav } from '@/config/navigation'

export function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#F0EBE5] bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">

          {/* Brand block */}
          <div className="col-span-2 sm:col-span-1">
            <Link href={routes.home} className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]">
                <Sparkles size={16} className="text-white" />
              </span>
              <span className="text-base font-bold tracking-tight text-[#111111]">
                {siteConfig.name}
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-[#666666]">
              {siteConfig.tagline}.
            </p>
          </div>

          {/* Link columns */}
          {footerNav.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#999999]">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#666666] transition-colors hover:text-[#FF6B35]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-[#F0EBE5] pt-6">
          <p className="text-xs text-[#999999]">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { BrandIcon } from '@/components/brand/BrandIcon'

const LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

export function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer aria-label="Site footer">
      <div>
        <div className="rounded-t-[20px] border border-b-0 border-[#E8E3DE] bg-white px-6 pb-6 pt-8">
          <div className="flex flex-col items-center text-center">

            {/* Brand icon — links to homepage */}
            <Link
              href={routes.home}
              aria-label={`${siteConfig.name} - Home`}
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B35] shadow-[0_2px_8px_rgba(255,107,53,0.25)] transition-opacity hover:opacity-90"
            >
              <BrandIcon size={25} />
            </Link>

            {/* Brand name — plain text, not a heading */}
            <p className="text-base font-semibold text-[#111111]">
              {siteConfig.name}
            </p>

            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#777777]">
              Discover, save, and share high-quality AI prompts that help you
              create faster, think better, and get more done.
            </p>

            <div className="my-4 h-px w-10 bg-[#EEEEEE]" />

            {/* Footer nav — labeled to distinguish from header nav */}
            <nav aria-label="Footer" className="mb-4 flex flex-wrap justify-center gap-5">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-[#999999] transition-colors hover:text-[#FF6B35]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <p className="text-[11px] text-[#BBBBBB]">
              © {year} {siteConfig.name} • Crafted for the AI community
            </p>

          </div>
        </div>
      </div>
    </footer>
  )
}
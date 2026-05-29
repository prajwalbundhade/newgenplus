/**
 * Public route-group layout.
 *
 * Wraps all anonymous-facing pages (homepage, prompt detail, category/model
 * landings, search, legal). Renders the shared header and footer around the
 * page content. Fully static shell — no auth, no client JS in the chrome.
 *
 * Isolated from the (admin) group, which has its own gated layout.
 */

import { PublicHeader } from '@/components/layout/PublicHeader'
import { PublicFooter } from '@/components/layout/PublicFooter'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFF9F5]">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}

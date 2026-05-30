'use client'

/**
 * GoogleAnalytics — loads GA4 (gtag.js) and tracks SPA route changes.
 *
 * Implementation notes (modern Next.js App Router best practice):
 *   - The gtag script is injected via `next/script` with
 *     `strategy="afterInteractive"`, so it never blocks first paint or
 *     hydration but still loads early enough to capture the first pageview.
 *   - `send_page_view: false` in the initial config; we send pageviews
 *     ourselves so client-side navigations (which don't reload the page) are
 *     all captured exactly once.
 *   - The pathname/searchParams listener lives in a child wrapped in
 *     <Suspense> because `useSearchParams` opts a route into client rendering
 *     at the boundary; isolating it keeps the rest of the tree static.
 *   - Renders nothing in non-production unless explicitly forced, so dev runs
 *     don't pollute analytics.
 */

import Script from 'next/script'
import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { GA_MEASUREMENT_ID, ANALYTICS_ENABLED } from '@/config/seo'
import { pageview } from '@/lib/analytics/gtag'

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    const query = searchParams?.toString()
    pageview(query ? `${pathname}?${query}` : pathname)
  }, [pathname, searchParams])

  return null
}

export function GoogleAnalytics() {
  if (!ANALYTICS_ENABLED) return null

  return (
    <>
      <Script
        id="ga-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
    </>
  )
}

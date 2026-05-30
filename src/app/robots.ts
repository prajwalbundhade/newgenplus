/**
 * Dynamic robots.txt — served at /robots.txt.
 *
 * Allows the public site, blocks the admin perimeter and all API/dynamic
 * machinery, and points crawlers at the sitemap. Generated from `siteConfig`
 * so the host is always correct per environment.
 */
import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Allow the OG image endpoint so social scrapers (which respect
        // robots.txt) can fetch per-prompt share cards. Longest-match wins,
        // so this overrides the broader /api disallow below.
        allow: ['/', '/api/og/'],
        disallow: [
          '/admin',
          '/admin/',
          '/api',
          '/api/',
          '/search', // result URLs are noindex; keep them out of the crawl budget
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}

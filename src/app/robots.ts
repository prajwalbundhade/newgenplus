/**
 * Dynamic robots.txt served at /robots.txt.
 *
 * Public content is crawlable. Admin, API, and query-driven search result
 * pages are excluded from crawl budget and indexing surfaces.
 */
import type { MetadataRoute } from 'next'
import { countPublishedPrompts } from '@/features/prompts/queries/prompt.queries'
import { siteConfig } from '@/config/site'
import { absoluteSiteUrl, sitemapPageCount } from '@/lib/seo/sitemap'

export const revalidate = 3600

const DISALLOW_PRIVATE = [
  '/admin',
  '/admin/',
  '/api',
  '/api/',
  '/search',
]

const AI_AND_SEARCH_BOTS = [
  'Googlebot',
  'Bingbot',
  'Google-Extended',
  'GoogleOther',
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Claude-SearchBot',
  'anthropic-ai',
  'Applebot',
]

export default async function robots(): Promise<MetadataRoute.Robots> {
  const totalPrompts = await countPublishedPrompts()
  const promptSitemaps = Array.from(
    { length: sitemapPageCount(totalPrompts) },
    (_, id) => absoluteSiteUrl(`/prompt/sitemap/${id}.xml`)
  )

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/og/'],
        disallow: DISALLOW_PRIVATE,
      },
      {
        userAgent: AI_AND_SEARCH_BOTS,
        allow: ['/', '/og/'],
        disallow: DISALLOW_PRIVATE,
      },
    ],
    sitemap: [
      absoluteSiteUrl('/sitemap-index.xml'),
      absoluteSiteUrl('/sitemap.xml'),
      absoluteSiteUrl('/category/sitemap.xml'),
      absoluteSiteUrl('/model/sitemap.xml'),
      ...promptSitemaps,
    ],
    host: siteConfig.url,
  }
}

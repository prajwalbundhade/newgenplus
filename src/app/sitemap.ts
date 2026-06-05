/**
 * Static sitemap served at /sitemap.xml.
 *
 * High-volume content lives in segmented sitemaps:
 *   /category/sitemap.xml
 *   /model/sitemap.xml
 *   /prompt/sitemap/[id].xml
 *
 * The sitemap index at /sitemap-index.xml lists all segments for crawlers and
 * webmaster tools.
 */
import type { MetadataRoute } from 'next'
import { routes } from '@/config/routes'
import { absoluteSiteUrl } from '@/lib/seo/sitemap'

export const revalidate = 3600

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: absoluteSiteUrl(routes.home),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteSiteUrl(routes.about),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: absoluteSiteUrl(routes.contact),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: absoluteSiteUrl(routes.privacy),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: absoluteSiteUrl(routes.terms),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}

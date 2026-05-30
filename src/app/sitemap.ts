/**
 * Dynamic sitemap — served at /sitemap.xml.
 *
 * Built from live published Supabase content: homepage + every prompt,
 * category, and model page. `lastModified`, `changeFrequency`, and `priority`
 * are derived per content type.
 *
 * Scaling note: Google caps a single sitemap at 50,000 URLs. We currently emit
 * a single map and cap the prompt query accordingly. When prompt volume
 * approaches that limit, this file should switch to `generateSitemaps()` to
 * segment by id range (e.g. /sitemap/0.xml, /sitemap/1.xml) with a sitemap
 * index — the query layer (`listSitemapPrompts`) already supports paging via
 * its `limit`, so segmentation is a localized change here.
 */
import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { listSitemapPrompts } from '@/features/prompts/queries/prompt.queries'
import {
  listCategorySitemapEntries,
  listModelSitemapEntries,
} from '@/features/taxonomy/queries/taxonomy.queries'

// Revalidate the sitemap hourly so freshly-published content is discoverable
// without a redeploy, while keeping it cheaply cached for crawlers.
export const revalidate = 3600

function abs(path: string): string {
  return `${siteConfig.url}${path}`
}

function toDate(iso: string | null): Date {
  const d = iso ? new Date(iso) : new Date()
  return Number.isNaN(d.getTime()) ? new Date() : d
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [prompts, categories, models] = await Promise.all([
    listSitemapPrompts(),
    listCategorySitemapEntries(),
    listModelSitemapEntries(),
  ])

  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: abs(routes.home),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: abs(routes.about),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  const promptEntries: MetadataRoute.Sitemap = prompts.map((p) => ({
    url: abs(routes.prompt(p.slug)),
    lastModified: toDate(p.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: abs(routes.category(c.slug)),
    lastModified: toDate(c.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const modelEntries: MetadataRoute.Sitemap = models.map((m) => ({
    url: abs(routes.model(m.slug)),
    lastModified: toDate(m.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticEntries, ...categoryEntries, ...modelEntries, ...promptEntries]
}

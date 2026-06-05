import type { MetadataRoute } from 'next'
import { routes } from '@/config/routes'
import { listModelSitemapEntries } from '@/features/taxonomy/queries/taxonomy.queries'
import { absoluteSiteUrl, safeDate } from '@/lib/seo/sitemap'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const models = await listModelSitemapEntries()

  return models.map((model) => ({
    url: absoluteSiteUrl(routes.model(model.slug)),
    lastModified: safeDate(model.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
}

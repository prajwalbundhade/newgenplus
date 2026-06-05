import type { MetadataRoute } from 'next'
import { routes } from '@/config/routes'
import { listCategorySitemapEntries } from '@/features/taxonomy/queries/taxonomy.queries'
import { absoluteSiteUrl, safeDate } from '@/lib/seo/sitemap'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await listCategorySitemapEntries()

  return categories.map((category) => ({
    url: absoluteSiteUrl(routes.category(category.slug)),
    lastModified: safeDate(category.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
}

import type { MetadataRoute } from 'next'
import { routes } from '@/config/routes'
import {
  countPublishedPrompts,
  listSitemapPromptsPage,
} from '@/features/prompts/queries/prompt.queries'
import {
  absoluteSiteUrl,
  safeDate,
  sitemapPageCount,
  SITEMAP_PAGE_SIZE,
} from '@/lib/seo/sitemap'

export const revalidate = 3600

export async function generateSitemaps() {
  const total = await countPublishedPrompts()
  return Array.from({ length: sitemapPageCount(total) }, (_, id) => ({ id }))
}

export default async function sitemap(props: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id)
  const page = Number.isFinite(id) && id >= 0 ? id : 0
  const prompts = await listSitemapPromptsPage({
    offset: page * SITEMAP_PAGE_SIZE,
    limit: SITEMAP_PAGE_SIZE,
  })

  return prompts.map((prompt) => ({
    url: absoluteSiteUrl(routes.prompt(prompt.slug)),
    lastModified: safeDate(prompt.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
    ...(prompt.imageUrl ? { images: [prompt.imageUrl] } : {}),
  }))
}

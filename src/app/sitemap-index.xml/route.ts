import { countPublishedPrompts } from '@/features/prompts/queries/prompt.queries'
import {
  absoluteSiteUrl,
  sitemapIndexXml,
  sitemapPageCount,
} from '@/lib/seo/sitemap'

export const revalidate = 3600

export async function GET() {
  const totalPrompts = await countPublishedPrompts()
  const promptSitemaps = Array.from(
    { length: sitemapPageCount(totalPrompts) },
    (_, id) => absoluteSiteUrl(`/prompt/sitemap/${id}.xml`)
  )

  const xml = sitemapIndexXml([
    absoluteSiteUrl('/sitemap.xml'),
    absoluteSiteUrl('/category/sitemap.xml'),
    absoluteSiteUrl('/model/sitemap.xml'),
    ...promptSitemaps,
  ])

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

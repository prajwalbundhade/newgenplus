import { siteConfig } from '@/config/site'

export const SITEMAP_PAGE_SIZE = 45000

export function absoluteSiteUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`
}

export function safeDate(value: string | null | undefined): Date {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export function sitemapPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / SITEMAP_PAGE_SIZE))
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function sitemapIndexXml(urls: string[]): string {
  const now = new Date().toISOString()
  const entries = urls
    .map(
      (url) => `  <sitemap>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`
}

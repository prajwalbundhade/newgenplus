/**
 * Metadata composer.
 *
 * `buildMetadata` produces a fully-formed Next.js `Metadata` object from a
 * small per-page input, applying the site-wide defaults (canonical strategy,
 * Open Graph, Twitter card) so individual routes stay declarative and
 * consistent. Server-only by nature — these objects are consumed by Next's
 * `generateMetadata`/`metadata` exports which run on the server.
 *
 * Canonical strategy: callers pass a CLEAN path (no query string). Filters,
 * sort, and pagination params are therefore never part of the canonical URL,
 * which is how we prevent duplicate-content indexing of the same content under
 * `?sort=`, `?category=`, `?page=` permutations.
 */
import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export interface OgImageInput {
  url: string
  width?: number
  height?: number
  alt?: string
}

export interface BuildMetadataInput {
  /** Page title WITHOUT the brand suffix (the template adds it), or pass `absoluteTitle`. */
  title?: string
  /** Use when the full title is already composed (e.g. homepage hero title). */
  absoluteTitle?: string
  description?: string
  /** Clean canonical path beginning with `/`, e.g. `/prompt/foo`. No query string. */
  path: string
  /** Per-page keywords, merged with the site defaults. */
  keywords?: string[]
  /** OG/Twitter images. Defaults to the site OG image when omitted. */
  images?: OgImageInput[]
  /** `article` for prompt pages, `website` elsewhere. */
  ogType?: 'website' | 'article'
  /** Set false to keep a page out of the index (e.g. /search). */
  index?: boolean
  /** Article-only metadata. */
  publishedTime?: string | null
  modifiedTime?: string | null
  authorName?: string | null
}

function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    absoluteTitle,
    description = siteConfig.description,
    path,
    keywords = [],
    images,
    ogType = 'website',
    index = true,
    publishedTime,
    modifiedTime,
    authorName,
  } = input

  const canonical = absoluteUrl(path)

  // Resolve the title for OG/Twitter where the template isn't applied.
  const resolvedTitle =
    absoluteTitle ?? (title ? `${title} — ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`)

  // When the caller supplies images we set them explicitly (overriding the
  // file-based default). When omitted, we DON'T set `images` so Next inherits
  // the site default from `app/opengraph-image.tsx` — avoiding duplicate tags.
  const hasImages = !!images && images.length > 0
  const ogImages = hasImages
    ? images!.map((img) => ({
        url: absoluteUrl(img.url),
        width: img.width,
        height: img.height,
        alt: img.alt ?? siteConfig.name,
      }))
    : undefined

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: {
      type: ogType,
      siteName: siteConfig.name,
      title: resolvedTitle,
      description,
      url: canonical,
      locale: siteConfig.locale,
      ...(ogImages ? { images: ogImages } : {}),
      ...(ogType === 'article'
        ? {
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(authorName ? { authors: [authorName] } : {}),
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: `@${siteConfig.twitter}`,
      creator: `@${siteConfig.twitter}`,
      title: resolvedTitle,
      description,
      ...(ogImages ? { images: ogImages.map((i) => i.url) } : {}),
    },
  }
}

/** Convenience: absolute URL helper exported for callers that need it. */
export { absoluteUrl }

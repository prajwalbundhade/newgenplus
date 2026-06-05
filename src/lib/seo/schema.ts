/**
 * schema.org JSON-LD builders.
 *
 * Pure functions that return plain objects ready to be serialised into a
 * `<script type="application/ld+json">` tag (see `JsonLd.tsx`). Every field is
 * derived from real content passed by the caller — there are no hardcoded
 * ratings, counts, or descriptions here.
 *
 * Schemas implemented:
 *   - Organization        (site-wide, root layout)
 *   - WebSite + SearchAction (site-wide, enables the sitelinks search box)
 *   - CreativeWork        (prompt detail) with optional aggregateRating + reviews
 *   - ImageObject         (prompt media)
 *   - CollectionPage      (category / model landing pages)
 *   - BreadcrumbList      (prompt / category / model)
 *   - FAQPage             (visible FAQ sections)
 *   - ContactPage         (contact route)
 */
import { siteConfig } from '@/config/site'
import { socialProfiles } from '@/config/seo'
import { routes } from '@/config/routes'

type JsonLdObject = Record<string, unknown>

function abs(path: string): string {
  if (path.startsWith('http')) return path
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`
}

// ---------------------------------------------------------------------------
// Site-wide
// ---------------------------------------------------------------------------

export function organizationSchema(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: {
      '@type': 'ImageObject',
      url: abs('/icon.svg'),
    },
    ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
  }
}

export function webSiteSchema(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { '@id': `${siteConfig.url}/#organization` },
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

export interface BreadcrumbCrumb {
  name: string
  /** Clean path beginning with `/`. */
  path: string
}

export function breadcrumbSchema(crumbs: BreadcrumbCrumb[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: abs(crumb.path),
    })),
  }
}

// ---------------------------------------------------------------------------
// Prompt — CreativeWork
// ---------------------------------------------------------------------------

export interface PromptReviewInput {
  reviewerName: string
  rating: number | null
  body: string
  createdAt: string
}

export interface PromptSchemaInput {
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  imageWidth?: number | null
  imageHeight?: number | null
  creatorName: string
  modelName: string | null
  publishedAt: string | null
  updatedAt?: string | null
  avgRating: number | null
  reviewCount: number
  keywords?: string[]
  reviews?: PromptReviewInput[]
}

export function promptSchema(input: PromptSchemaInput): JsonLdObject {
  const url = abs(routes.prompt(input.slug))
  const imageId = `${url}#primaryimage`

  const schema: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${url}#creativework`,
    name: input.title,
    headline: input.title,
    url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.imageUrl ? { image: { '@id': imageId } } : {}),
    author: {
      '@type': 'Person',
      name: input.creatorName,
    },
    publisher: { '@id': `${siteConfig.url}/#organization` },
    isAccessibleForFree: true,
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.updatedAt ? { dateModified: input.updatedAt } : {}),
    ...(input.modelName ? { keywords: dedupeKeywords(input) } : {}),
  }

  // Only emit aggregateRating when there is REAL rating data — fabricating an
  // aggregateRating with zero reviews is a structured-data policy violation.
  if (input.avgRating !== null && input.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(input.avgRating.toFixed(1)),
      reviewCount: input.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  // Include approved reviews that carry a body. Ratings come from real data.
  const reviews = (input.reviews ?? []).filter((r) => r.body?.trim().length > 0)
  if (reviews.length > 0) {
    schema.review = reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.reviewerName },
      datePublished: r.createdAt,
      reviewBody: r.body,
      ...(r.rating !== null
        ? {
            reviewRating: {
              '@type': 'Rating',
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    }))
  }

  return schema
}

export function imageObjectSchema(input: {
  pagePath: string
  title: string
  description: string | null
  imageUrl: string
  width?: number | null
  height?: number | null
}): JsonLdObject {
  const pageUrl = abs(input.pagePath)
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': `${pageUrl}#primaryimage`,
    contentUrl: input.imageUrl,
    url: input.imageUrl,
    name: input.title,
    ...(input.description ? { caption: input.description } : {}),
    ...(input.width ? { width: input.width } : {}),
    ...(input.height ? { height: input.height } : {}),
    representativeOfPage: true,
    isPartOf: { '@id': `${pageUrl}#creativework` },
  }
}

function dedupeKeywords(input: PromptSchemaInput): string[] {
  const base = input.keywords ?? []
  const out = new Set<string>()
  if (input.modelName) out.add(input.modelName)
  for (const k of base) out.add(k)
  return [...out]
}

// ---------------------------------------------------------------------------
// Category / Model — CollectionPage
// ---------------------------------------------------------------------------

export interface CollectionItemInput {
  name: string
  path: string
}

export interface CollectionSchemaInput {
  name: string
  description: string
  path: string
  items: CollectionItemInput[]
}

export function collectionPageSchema(input: CollectionSchemaInput): JsonLdObject {
  const url = abs(input.path)
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    name: input.name,
    description: input.description,
    url,
    isPartOf: { '@id': `${siteConfig.url}/#website` },
    ...(input.items.length > 0
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: input.items.length,
            itemListElement: input.items.map((item, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: item.name,
              url: abs(item.path),
            })),
          },
        }
      : {}),
  }
}

// ---------------------------------------------------------------------------
// FAQPage
// ---------------------------------------------------------------------------

export interface FaqSchemaItem {
  question: string
  answer: string
}

export function faqPageSchema(items: FaqSchemaItem[]): JsonLdObject | null {
  const validItems = items.filter(
    (item) => item.question.trim().length > 0 && item.answer.trim().length > 0
  )
  if (validItems.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: validItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

// ---------------------------------------------------------------------------
// ContactPage
// ---------------------------------------------------------------------------

export function contactPageSchema(input: {
  email: string
  description: string
}): JsonLdObject {
  const url = abs(routes.contact)
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${url}#contactpage`,
    name: `Contact ${siteConfig.name}`,
    description: input.description,
    url,
    isPartOf: { '@id': `${siteConfig.url}/#website` },
    mainEntity: {
      '@type': 'Organization',
      '@id': `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      email: input.email,
      contactPoint: {
        '@type': 'ContactPoint',
        email: input.email,
        contactType: 'customer support',
        availableLanguage: 'English',
      },
    },
  }
}

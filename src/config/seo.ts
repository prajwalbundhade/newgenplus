/**
 * SEO + analytics configuration.
 *
 * Single source of truth for everything search engines and social crawlers
 * consume that isn't already covered by `site.ts`: verification tokens, the
 * Google Analytics measurement id, social profile URLs (used for the
 * Organization `sameAs` graph), and shared OG image dimensions.
 *
 * Values that differ per environment are read from `NEXT_PUBLIC_*` env vars so
 * they can be set in Vercel without a code change; sensible literals are used
 * as fallbacks so local dev and preview deployments still work.
 */

/** Google Analytics 4 measurement id. Override per-env with NEXT_PUBLIC_GA_ID. */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID?.trim() || 'G-9Z6GS3RY2W'

/** GA only loads in production OR when explicitly forced (preview QA). */
export const ANALYTICS_ENABLED =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_FORCE_ANALYTICS === 'true'

/**
 * Search-engine site verification tokens.
 *
 * Google is already verified via the static file `public/google<token>.html`,
 * but we also emit the meta-tag form (belt and suspenders, and required by
 * some Search Console property types). Set the env vars in production; leaving
 * them blank simply omits the corresponding tag.
 */
export const verification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || '',
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim() || '',
  yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION?.trim() || '',
} as const

/**
 * Public social/brand profiles. Used for schema.org Organization `sameAs`,
 * which strengthens entity recognition in Google's Knowledge Graph.
 * Edit these to the platform's real profiles as they go live.
 */
export const socialProfiles: string[] = [
  // 'https://twitter.com/NeuwGenX',
  // 'https://www.linkedin.com/company/NeuwGenX',
]

/** Canonical OG image dimensions (1.91:1, the Facebook/Twitter sweet spot). */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const

/** Brand colours reused by OG image generation (mirrors globals brand tokens). */
export const OG_BRAND = {
  primary: '#FF6B35',
  secondary: '#FF8A4C',
  accent: '#FFB26B',
  background: '#FFF9F5',
  card: '#FFFFFF',
  text: '#111111',
  muted: '#666666',
} as const

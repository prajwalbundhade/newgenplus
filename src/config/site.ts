/**
 * Site configuration — single source of brand + site-level metadata.
 *
 * Consumed by the root layout, SEO metadata builders, header, and footer.
 * No hardcoded brand strings elsewhere in the app.
 */
import { clientEnv } from '@/config/env'

export const siteConfig = {
  name: 'NewGenPlus',
  tagline: 'Discover & copy the best AI prompts',
  description:
    'A free, curated library of high-quality AI prompts. Browse visually, copy instantly, and create with the best models — no account required.',
  /** Absolute base URL, no trailing slash. */
  url: clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''),
  /** Default social handle for Twitter cards (no @). */
  twitter: 'newgenplus',
  /** Default OG image path (generated route is added in the SEO phase). */
  ogImage: '/opengraph-image',
} as const

export type SiteConfig = typeof siteConfig

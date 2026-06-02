/**
 * Site configuration — single source of brand + site-level metadata.
 *
 * Consumed by the root layout, SEO metadata builders, header, and footer.
 * No hardcoded brand strings elsewhere in the app.
 */
import { clientEnv } from '@/config/env'

export const siteConfig = {
  name: 'NeuwGenX',
  tagline: 'Discover & copy the best AI prompts',
  description:
    'A free, curated library of high-quality AI prompts. Browse visually, copy instantly, and create with the best models — no account required.',
  /** Absolute base URL, no trailing slash. */
  url: clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''),
  /** Default social handle for Twitter cards (no @). */
  twitter: 'NeuwGenX',
  /** Default OG image path (generated route is added in the SEO phase). */
  ogImage: '/opengraph-image',
  /** BCP-47 locale used for OG/Twitter and html lang. */
  locale: 'en_US',
  /** Default, site-wide keywords. Per-page keywords extend these. */
  keywords: [
    'AI prompts',
    'prompt library',
    'Midjourney prompts',
    'ChatGPT prompts',
    'image generation prompts',
    'AI art prompts',
    'free prompts',
  ],
} as const

export type SiteConfig = typeof siteConfig

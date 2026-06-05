/**
 * Default site Open Graph image — auto-served at /opengraph-image.
 *
 * Next's file convention: this generates the OG image used wherever a page
 * doesn't supply its own (homepage, category/model pages, etc.). Pages that
 * need a content-specific card (prompts) point at /og/prompt/[slug] instead.
 */
import { ImageResponse } from 'next/og'
import { OgTemplate } from '@/lib/seo/og'
import { OG_IMAGE_SIZE } from '@/config/seo'
import { siteConfig } from '@/config/site'

export const runtime = 'nodejs'
export const alt = `${siteConfig.name} - ${siteConfig.tagline}`
export const size = { width: OG_IMAGE_SIZE.width, height: OG_IMAGE_SIZE.height }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <OgTemplate
        title="Discover & copy the best AI prompts"
        eyebrow="AI Prompt Library"
        footerNote={siteConfig.url.replace(/^https?:\/\//, '')}
      />
    ),
    { ...size }
  )
}

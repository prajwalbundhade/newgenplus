/**
 * Per-prompt dynamic Open Graph image — GET /api/og/[slug].
 *
 * Renders a branded 1200×630 card featuring the prompt title, its model, the
 * creator attribution, and (when available) the prompt's preview image. Every
 * published prompt therefore gets a unique, rich share card.
 *
 * Data comes from `getPromptOgData` (real published content only). Unknown or
 * unpublished slugs fall back to a generic branded card with a 404 status so
 * crawlers don't cache a broken image as canonical.
 *
 * Caching: the response sets a long s-maxage with stale-while-revalidate so
 * the (relatively expensive) satori render is amortised at the CDN edge.
 */
import { ImageResponse } from 'next/og'
import { OgTemplate } from '@/lib/seo/og'
import { OG_IMAGE_SIZE } from '@/config/seo'
import { siteConfig } from '@/config/site'
import { getPromptOgData } from '@/features/prompts/queries/prompt.queries'

export const runtime = 'nodejs'

const CACHE_HEADERS = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  let prompt: Awaited<ReturnType<typeof getPromptOgData>> = null
  try {
    prompt = await getPromptOgData(slug)
  } catch {
    prompt = null
  }

  if (!prompt) {
    return new ImageResponse(
      (
        <OgTemplate
          title="Prompt not found"
          eyebrow="AI Prompt"
          footerNote={siteConfig.url.replace(/^https?:\/\//, '')}
        />
      ),
      { ...OG_IMAGE_SIZE, status: 404, headers: CACHE_HEADERS }
    )
  }

  return new ImageResponse(
    (
      <OgTemplate
        title={prompt.title}
        eyebrow={prompt.modelName ?? 'AI Prompt'}
        footerNote={`by ${prompt.creatorName} · ${siteConfig.name}`}
        imageUrl={prompt.imageUrl}
      />
    ),
    { ...OG_IMAGE_SIZE, headers: CACHE_HEADERS }
  )
}

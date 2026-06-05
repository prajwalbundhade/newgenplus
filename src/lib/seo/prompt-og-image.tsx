import { ImageResponse } from 'next/og'
import { OG_IMAGE_SIZE } from '@/config/seo'
import { siteConfig } from '@/config/site'
import { OgTemplate } from '@/lib/seo/og'
import { getPromptOgData } from '@/features/prompts/queries/prompt.queries'

const CACHE_HEADERS = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  'X-Robots-Tag': 'noindex',
}

export async function renderPromptOgImage(slug: string) {
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
        footerNote={`by ${prompt.creatorName} - ${siteConfig.name}`}
        imageUrl={prompt.imageUrl}
      />
    ),
    { ...OG_IMAGE_SIZE, headers: CACHE_HEADERS }
  )
}

/**
 * Public prompt Open Graph image route.
 *
 * Kept outside /api so robots.txt can block every API endpoint while social
 * platforms can still fetch prompt share cards.
 */
import { renderPromptOgImage } from '@/lib/seo/prompt-og-image'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  return renderPromptOgImage(slug)
}

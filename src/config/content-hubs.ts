/**
 * Future editorial discovery hubs.
 *
 * These are intentionally not routed or included in the sitemap yet. They give
 * the platform a typed architecture for future "best prompts" landing pages
 * without publishing thin or unfinished pages.
 */

export type ContentHubStatus = 'draft' | 'published'

export interface ContentHubDefinition {
  slug: string
  title: string
  description: string
  status: ContentHubStatus
  filters: {
    categorySlug?: string
    modelSlug?: string
    tags?: string[]
  }
}

export const contentHubDefinitions: ContentHubDefinition[] = [
  {
    slug: 'best-gpt-image-prompts',
    title: 'Best GPT Image Prompts',
    description: 'Curated image-generation prompts designed for GPT image tools.',
    status: 'draft',
    filters: { tags: ['gpt-image', 'image-generation'] },
  },
  {
    slug: 'best-nano-banana-prompts',
    title: 'Best Nano Banana Prompts',
    description: 'Curated prompt examples for Nano Banana image workflows.',
    status: 'draft',
    filters: { tags: ['nano-banana', 'image-generation'] },
  },
  {
    slug: 'best-grok-image-prompts',
    title: 'Best Grok Image Prompts',
    description: 'Curated Grok image prompts for visual ideation and production.',
    status: 'draft',
    filters: { tags: ['grok-image', 'image-generation'] },
  },
  {
    slug: 'best-portrait-prompts',
    title: 'Best Portrait Prompts',
    description: 'A future editorial hub for portrait prompt discovery.',
    status: 'draft',
    filters: { categorySlug: 'portrait', tags: ['portrait'] },
  },
  {
    slug: 'best-fashion-prompts',
    title: 'Best Fashion Prompts',
    description: 'A future editorial hub for fashion, editorial, and styling prompts.',
    status: 'draft',
    filters: { tags: ['fashion', 'editorial'] },
  },
  {
    slug: 'best-cinematic-prompts',
    title: 'Best Cinematic Prompts',
    description: 'A future editorial hub for cinematic scenes, lighting, and storytelling.',
    status: 'draft',
    filters: { categorySlug: 'cinematic', tags: ['cinematic'] },
  },
  {
    slug: 'best-product-photography-prompts',
    title: 'Best Product Photography Prompts',
    description: 'A future editorial hub for product photography and commercial visuals.',
    status: 'draft',
    filters: { categorySlug: 'product-design', tags: ['product', 'photography'] },
  },
]

export const publishedContentHubs = contentHubDefinitions.filter(
  (hub) => hub.status === 'published'
)

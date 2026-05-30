/**
 * Prompt detail page — /prompt/[slug]
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Eye, Copy, Star, Tag as TagIcon, Heart, Share2, Sparkles } from 'lucide-react'
import {
  getPromptBySlug,
  listPublishedSlugs,
  listSimilarPrompts,
  listApprovedReviews,
} from '@/features/prompts/queries/prompt.queries'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { formatCount } from '@/lib/utils'
import { buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/JsonLd'
import { promptSchema, breadcrumbSchema } from '@/lib/seo/schema'
import { CopyButton } from '@/components/prompt/CopyButton'
import { LikeButton } from '@/components/prompt/LikeButton'
import { ShareButton } from '@/components/prompt/Sharebutton'
import { ViewTracker } from '@/components/prompt/ViewTracker'
import { PromptGrid } from '@/components/prompt/PromptGrid'
import { ModelIcon } from '@/components/prompt/ModelIcon'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs(200)
  return slugs.map((slug) => ({ slug }))
}

interface PromptPageProps {
  params: Promise<{ slug: string }>
}

/** Build a clean, indexable description from the prompt's own content. */
function promptDescription(prompt: {
  title: string
  description: string | null
  promptText: string | null
  modelName: string | null
}): string {
  if (prompt.description?.trim()) return prompt.description.trim()
  if (prompt.promptText?.trim()) {
    const text = prompt.promptText.trim().replace(/\s+/g, ' ')
    return text.length > 155 ? `${text.slice(0, 152)}…` : text
  }
  const model = prompt.modelName ? ` for ${prompt.modelName}` : ''
  return `${prompt.title} — a curated AI prompt${model} on ${siteConfig.name}. Copy it free, no account required.`
}

export async function generateMetadata({ params }: PromptPageProps): Promise<Metadata> {
  const { slug } = await params
  const prompt = await getPromptBySlug(slug)
  if (!prompt) {
    return buildMetadata({
      title: 'Prompt not found',
      description: 'This prompt could not be found.',
      path: routes.prompt(slug),
      index: false,
    })
  }

  const description = promptDescription(prompt)
  const titleWithModel = prompt.modelName
    ? `${prompt.title} — ${prompt.modelName} Prompt`
    : `${prompt.title} — AI Prompt`

  return buildMetadata({
    title: titleWithModel,
    description,
    path: routes.prompt(prompt.slug),
    ogType: 'article',
    keywords: [
      prompt.title,
      ...(prompt.modelName ? [prompt.modelName, `${prompt.modelName} prompt`] : []),
      ...(prompt.category ? [prompt.category.name] : []),
      ...prompt.tags,
    ],
    images: [
      {
        // Per-prompt branded share card. Falls back internally to a generic
        // card if media is missing, so this URL is always valid.
        url: `/api/og/${prompt.slug}`,
        width: 1200,
        height: 630,
        alt: prompt.title,
      },
    ],
    publishedTime: prompt.publishedAt,
    authorName: prompt.creatorName,
  })
}

export default async function PromptDetailPage({ params }: PromptPageProps) {
  const { slug } = await params
  const prompt = await getPromptBySlug(slug)
  if (!prompt) notFound()

  const [similar, reviews] = await Promise.all([
    listSimilarPrompts(prompt.id, prompt.categoryId),
    listApprovedReviews(prompt.id),
  ])

  // Build JSON-LD from real content: CreativeWork (+ aggregateRating/reviews
  // only when approved reviews exist) and a breadcrumb trail.
  const ldPrompt = promptSchema({
    title: prompt.title,
    slug: prompt.slug,
    description: prompt.description,
    imageUrl: prompt.imageUrl,
    creatorName: prompt.creatorName,
    modelName: prompt.model?.name ?? prompt.modelName,
    publishedAt: prompt.publishedAt,
    avgRating: prompt.avgRating,
    reviewCount: prompt.reviewCount,
    keywords: prompt.tags,
    reviews: reviews.map((r) => ({
      reviewerName: r.reviewerName,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
    })),
  })

  const ldBreadcrumb = breadcrumbSchema([
    { name: 'Home', path: routes.home },
    ...(prompt.category
      ? [{ name: prompt.category.name, path: routes.category(prompt.category.slug) }]
      : []),
    { name: prompt.title, path: routes.prompt(prompt.slug) },
  ])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-6 sm:px-6 lg:px-8">
      <JsonLd id="ld-prompt" schema={ldPrompt} />
      <JsonLd id="ld-prompt-breadcrumb" schema={ldBreadcrumb} />
      <ViewTracker
        resourceId={prompt.id}
        slug={prompt.slug}
        title={prompt.title}
        modelName={prompt.model?.name ?? prompt.modelName}
      />

      {/* ── Breadcrumb ── */}
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-[#BBBBBB]">
        <Link href={routes.home} className="transition-colors hover:text-[#111111]">
          Home
        </Link>
        <span>/</span>
        {prompt.category && (
          <>
            <Link
              href={routes.category(prompt.category.slug)}
              className="transition-colors hover:text-[#111111]"
            >
              {prompt.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="truncate text-[#111111]">{prompt.title}</span>
      </nav>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[60%_40%]">

        <div className="overflow-hidden rounded-3xl bg-transparent lg:h-[calc(100vh-8rem)] h-[400px]">
          {prompt.imageUrl ? (
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={prompt.imageUrl}
                alt={prompt.title}
                className="max-h-full max-w-full rounded-3xl object-contain shadow-sm"
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Sparkles size={32} className="text-[#E5DDD6]" />
            </div>
          )}
        </div>

        {/* ── Right: Details ── */}
        <div className="flex flex-col rounded-2xl border border-[#F0EBE5] bg-white p-5">

          {/* Badges */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {prompt.category && (
              <Link href={routes.category(prompt.category.slug)}>
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#D7E4BF] bg-[#F6FAEF] px-3 text-[11px] font-medium text-[#5E7D2F]">
                  <TagIcon size={10} />
                  {prompt.category.name}
                </span>
              </Link>
            )}
            {prompt.model && (
              <Link href={routes.model(prompt.model.slug)}>
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#DCE5F2] bg-[#F7FAFE] px-3 text-[11px] font-medium text-[#4B6B93]">
                  <ModelIcon name={prompt.model.name} slug={prompt.model.slug} logo_path={prompt.model.logo_path} size="sm" />
                  {prompt.model.name}
                </span>
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[16px] font-semibold leading-snug tracking-tight text-[#111111]">
            {prompt.title}
          </h1>

          {/* Creator */}
          <p className="mt-0.5 text-[12px] text-[#BBBBBB]">
            by <span className="font-medium text-[#777777]">{prompt.creatorName}</span>
          </p>

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 border-y border-[#F5F0EC] py-2.5 text-[11px] text-[#666666]">
            <span className="flex items-center gap-1">
              <Eye size={12} />{formatCount(prompt.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <Copy size={12} />{formatCount(prompt.copyCount)}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={12} />{formatCount(prompt.likeCount)}
            </span>
            {prompt.avgRating !== null && (
              <span className="flex items-center gap-1">
                <Star size={12} className="fill-[#FFB26B] text-[#FFB26B]" />
                {prompt.avgRating.toFixed(1)}
              </span>
            )}
          </div>

          {/* ── Prompt section ── */}
          {prompt.promptText && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[#666666]">
                Prompt
              </p>

              {/* Action bar */}
              <div className="flex items-center gap-2">
                <CopyButton
                  resourceId={prompt.id}
                  text={prompt.promptText}
                  slug={prompt.slug}
                  title={prompt.title}
                  className="cursor-pointer h-9 flex-1 rounded-xl bg-[#111111] text-[12px] font-medium text-white transition-colors hover:bg-[#333333]"
                />
                <ShareButton
                  slug={prompt.slug}
                  title={prompt.title}
                  imageUrl={prompt.imageUrl ?? undefined}
                  className="cursor-pointer flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#D9CFC7] bg-white text-[#888888] transition-colors hover:border-[#CCCCCC] hover:text-[#111111]"
                  aria-label="Share prompt"
                >
                  <Share2 size={14} />
                </ShareButton>
                <LikeButton
                  resourceId={prompt.id}
                  initialCount={prompt.likeCount}
                  variant="button"
                  className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border border-[#D9CFC7] bg-white px-3 text-[11px] text-[#888888] transition-colors hover:border-[#CCCCCC] hover:text-[#111111] focus:outline-none focus:ring-0 active:border-[#EEEEEE]"
                />
              </div>

              {/* Prompt box */}
              <div className="max-h-[200px] min-h-[120px] overflow-y-auto rounded-xl border border-[#D9CFC7] bg-[#FFFCFA] p-3.5 font-mono text-[11.5px] leading-relaxed text-[#111111] [scrollbar-width:thin]">
                <p className="whitespace-pre-wrap break-words">{prompt.promptText}</p>
              </div>
            </div>
          )}

          {/* ── Description section ── */}
          {prompt.description && (
            <div className="mt-5 flex flex-col gap-2 border-t border-dashed border-[#EDE8E3] pt-5">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[#666666]">
                About this prompt
              </p>
              <div className="max-h-[90px] overflow-y-auto rounded-xl border border-[#D8D0C8] bg-[#F8F5F2] p-3.5 [scrollbar-width:thin]">
                <p className="text-[12px] italic leading-relaxed text-[#555555]">
                  {prompt.description}
                </p>
              </div>
            </div>
          )}

          {/* ── Tags ── */}
          {prompt.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#ECEAE6] px-2.5 py-0.5 text-[10px] text-[#666666]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-[15px] font-semibold text-[#111111]">
            Reviews{' '}
            <span className="text-sm font-normal text-[#999999]">({reviews.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-[#F0EBE5] bg-white p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#111111]">
                    {review.reviewerName}
                  </span>
                  {review.rating !== null && (
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={
                            i < review.rating!
                              ? 'fill-[#FFB26B] text-[#FFB26B]'
                              : 'text-[#E5DDD6]'
                          }
                        />
                      ))}
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] leading-relaxed text-[#666666]">{review.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Similar prompts ── */}
      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-[15px] font-semibold text-[#111111]">More like this</h2>
          <PromptGrid prompts={similar} />
        </section>
      )}
    </div>
  )
}
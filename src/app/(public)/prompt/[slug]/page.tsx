/**
 * Prompt detail page — /prompt/[slug]
 *
 * SSG via generateStaticParams + ISR. Large image, copyable prompt, metadata,
 * similar prompts, and approved reviews. Records a view on mount.
 */

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Eye, Copy, Star, Tag as TagIcon, Cpu } from 'lucide-react'
import {
  getPromptBySlug,
  listPublishedSlugs,
  listSimilarPrompts,
  listApprovedReviews,
} from '@/features/prompts/queries/prompt.queries'
import { siteConfig } from '@/config/site'
import { routes } from '@/config/routes'
import { formatCount } from '@/lib/utils'
import { CopyButton } from '@/components/prompt/CopyButton'
import { ViewTracker } from '@/components/prompt/ViewTracker'
import { PromptGrid } from '@/components/prompt/PromptGrid'
import { Badge } from '@/components/ui/badge'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs(200)
  return slugs.map((slug) => ({ slug }))
}

interface PromptPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PromptPageProps): Promise<Metadata> {
  const { slug } = await params
  const prompt = await getPromptBySlug(slug)
  if (!prompt) return { title: 'Prompt not found' }

  const description =
    prompt.description ?? `${prompt.title} — a curated AI prompt on ${siteConfig.name}.`

  return {
    title: prompt.title,
    description,
    alternates: { canonical: routes.prompt(prompt.slug) },
    openGraph: {
      title: prompt.title,
      description,
      type: 'article',
      url: `${siteConfig.url}${routes.prompt(prompt.slug)}`,
      ...(prompt.imageUrl ? { images: [{ url: prompt.imageUrl }] } : {}),
    },
  }
}

export default async function PromptDetailPage({ params }: PromptPageProps) {
  const { slug } = await params
  const prompt = await getPromptBySlug(slug)
  if (!prompt) notFound()

  const [similar, reviews] = await Promise.all([
    listSimilarPrompts(prompt.id, prompt.categoryId),
    listApprovedReviews(prompt.id),
  ])

  const aspectRatio =
    prompt.width && prompt.height ? `${prompt.width} / ${prompt.height}` : '4 / 5'

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <ViewTracker resourceId={prompt.id} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">

        {/* ── Image ── */}
        <div>
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-[#F0EBE5] bg-white"
            style={{ aspectRatio }}
          >
            {prompt.imageUrl ? (
              <Image
                src={prompt.imageUrl}
                alt={prompt.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain"
                {...(prompt.blurDataUrl
                  ? { placeholder: 'blur' as const, blurDataURL: prompt.blurDataUrl }
                  : {})}
              />
            ) : null}
          </div>
        </div>

        {/* ── Details ── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="text-2xl font-bold tracking-tight text-[#111111]">{prompt.title}</h1>
          <p className="mt-1.5 text-sm text-[#666666]">by {prompt.creatorName}</p>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4 text-sm text-[#666666]">
            <span className="flex items-center gap-1.5">
              <Eye size={15} className="text-[#999999]" />
              {formatCount(prompt.viewCount)} views
            </span>
            <span className="flex items-center gap-1.5">
              <Copy size={15} className="text-[#999999]" />
              {formatCount(prompt.copyCount)} copies
            </span>
            {prompt.avgRating !== null && (
              <span className="flex items-center gap-1.5">
                <Star size={15} className="fill-[#FFB26B] text-[#FFB26B]" />
                {prompt.avgRating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Prompt text */}
          {prompt.promptText && (
            <div className="mt-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#999999]">
                Prompt
              </h2>
              <div className="rounded-xl border border-[#F0EBE5] bg-[#FFFCFA] p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111111]">
                  {prompt.promptText}
                </p>
              </div>
              <div className="mt-3">
                <CopyButton resourceId={prompt.id} text={prompt.promptText} className="w-full" />
              </div>
            </div>
          )}

          {/* Description */}
          {prompt.description && (
            <p className="mt-6 text-sm leading-relaxed text-[#666666]">{prompt.description}</p>
          )}

          {/* Meta chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {prompt.category && (
              <Link href={routes.category(prompt.category.slug)}>
                <Badge variant="secondary" className="gap-1">
                  <TagIcon size={11} />
                  {prompt.category.name}
                </Badge>
              </Link>
            )}
            {prompt.model && (
              <Link href={routes.model(prompt.model.slug)}>
                <Badge variant="info" className="gap-1">
                  <Cpu size={11} />
                  {prompt.model.name}
                </Badge>
              </Link>
            )}
          </div>

          {/* Tags */}
          {prompt.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {prompt.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#FFF9F5] px-2.5 py-0.5 text-xs text-[#999999]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-lg font-semibold text-[#111111]">
            Reviews <span className="text-sm font-normal text-[#999999]">({reviews.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-[#F0EBE5] bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#111111]">{review.reviewerName}</span>
                  {review.rating !== null && (
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={i < review.rating! ? 'fill-[#FFB26B] text-[#FFB26B]' : 'text-[#E5DDD6]'}
                        />
                      ))}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#666666]">{review.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Similar ── */}
      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-lg font-semibold text-[#111111]">More like this</h2>
          <PromptGrid prompts={similar} />
        </section>
      )}
    </div>
  )
}

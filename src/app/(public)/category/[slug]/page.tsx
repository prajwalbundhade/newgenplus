/**
 * Category landing - /category/[slug]
 * ISR filtered grid plus AI-readable overview, FAQs, and internal links.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import {
  getCategoryBySlug,
  listPublishedCategories,
  listRelatedCategories,
} from '@/features/taxonomy/queries/taxonomy.queries'
import { listPublishedPrompts } from '@/features/prompts/queries/prompt.queries'
import { PromptGrid } from '@/components/prompt/PromptGrid'
import { EmptyState } from '@/components/admin/EmptyState'
import { routes } from '@/config/routes'
import { siteConfig } from '@/config/site'
import { buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema'
import { buildCategoryAiContent } from '@/lib/seo/content'

export const revalidate = 120

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const categories = await listPublishedCategories()
  return categories.map((category) => ({ slug: category.slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) {
    return buildMetadata({
      title: 'Category not found',
      description: 'This category could not be found.',
      path: routes.category(slug),
      index: false,
    })
  }

  const description =
    category.description?.trim() ||
    `Browse the best ${category.name} AI prompts on ${siteConfig.name}. Copy curated ${category.name.toLowerCase()} prompts instantly - free, no account required.`

  return buildMetadata({
    title: `${category.name} AI Prompts`,
    description,
    path: routes.category(slug),
    keywords: [category.name, `${category.name} prompts`, `${category.name} AI prompts`],
  })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const [prompts, relatedCategories] = await Promise.all([
    listPublishedPrompts({ categorySlug: slug, sort: 'top', limit: 60 }),
    listRelatedCategories(slug, 6),
  ])

  const description =
    category.description?.trim() ||
    `Browse the best ${category.name} AI prompts on ${siteConfig.name}.`
  const aiContent = buildCategoryAiContent(category, prompts, relatedCategories)

  const ldCollection = collectionPageSchema({
    name: `${category.name} AI Prompts`,
    description,
    path: routes.category(slug),
    items: prompts.map((p) => ({ name: p.title, path: routes.prompt(p.slug) })),
  })

  const ldBreadcrumb = breadcrumbSchema([
    { name: 'Home', path: routes.home },
    { name: category.name, path: routes.category(slug) },
  ])

  const ldFaq = faqPageSchema(aiContent.faqs)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd id="ld-category" schema={ldCollection} />
      <JsonLd id="ld-category-breadcrumb" schema={ldBreadcrumb} />
      {ldFaq ? <JsonLd id="ld-category-faq" schema={ldFaq} /> : null}

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Category</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#111111]">{category.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666666]">{description}</p>
      </header>

      <section className="mb-8 rounded-2xl border border-[#F0EBE5] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-[#111111]">
          Category overview
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#555555]">
          {aiContent.overview}
        </p>

        {relatedCategories.length > 0 ? (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[#111111]">Related categories</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {relatedCategories.map((item) => (
                <Link
                  key={item.slug}
                  href={routes.category(item.slug)}
                  className="rounded-full border border-[#E8E3DE] bg-[#FFFCFA] px-3 py-1 text-xs font-medium text-[#666666] hover:border-[#FFB26B] hover:text-[#111111]"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {prompts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No prompts in this category yet"
          description="Check back soon - new prompts are added regularly."
        />
      ) : (
        <section>
          <h2 className="mb-4 text-[15px] font-semibold text-[#111111]">
            Top {category.name} prompts
          </h2>
          <PromptGrid prompts={prompts} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-[15px] font-semibold text-[#111111]">
          {category.name} prompt FAQs
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {aiContent.faqs.map((faq) => (
            <div key={faq.question} className="rounded-xl border border-[#F0EBE5] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#111111]">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-[#555555]">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

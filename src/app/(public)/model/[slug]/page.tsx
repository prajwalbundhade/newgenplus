/**
 * Model landing - /model/[slug]
 * ISR filtered grid plus AI-readable model guidance, FAQs, and links.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import {
  getModelBySlug,
  listPublishedModels,
  listRelatedModels,
} from '@/features/taxonomy/queries/taxonomy.queries'
import { listPublishedPrompts } from '@/features/prompts/queries/prompt.queries'
import { PromptGrid } from '@/components/prompt/PromptGrid'
import { ModelIcon } from '@/components/prompt/ModelIcon'
import { EmptyState } from '@/components/admin/EmptyState'
import { routes } from '@/config/routes'
import { siteConfig } from '@/config/site'
import { buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema'
import { buildModelAiContent } from '@/lib/seo/content'

export const revalidate = 120

interface ModelPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const models = await listPublishedModels()
  return models.map((model) => ({ slug: model.slug }))
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { slug } = await params
  const model = await getModelBySlug(slug)
  if (!model) {
    return buildMetadata({
      title: 'Model not found',
      description: 'This model could not be found.',
      path: routes.model(slug),
      index: false,
    })
  }

  const description =
    model.description?.trim() ||
    `Browse the best AI prompts for ${model.name}${model.provider ? ` by ${model.provider}` : ''} on ${siteConfig.name}. Copy curated ${model.name} prompts instantly - free, no account required.`

  return buildMetadata({
    title: `${model.name} Prompts`,
    description,
    path: routes.model(slug),
    keywords: [
      model.name,
      `${model.name} prompts`,
      ...(model.provider ? [model.provider] : []),
    ],
  })
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { slug } = await params
  const model = await getModelBySlug(slug)
  if (!model) notFound()

  const [prompts, relatedModels] = await Promise.all([
    listPublishedPrompts({ modelSlug: slug, sort: 'top', limit: 60 }),
    listRelatedModels(slug, 6),
  ])

  const description =
    model.description?.trim() ||
    `Browse the best AI prompts for ${model.name} on ${siteConfig.name}.`
  const aiContent = buildModelAiContent(model, prompts, relatedModels)

  const ldCollection = collectionPageSchema({
    name: `${model.name} Prompts`,
    description,
    path: routes.model(slug),
    items: prompts.map((p) => ({ name: p.title, path: routes.prompt(p.slug) })),
  })

  const ldBreadcrumb = breadcrumbSchema([
    { name: 'Home', path: routes.home },
    { name: model.name, path: routes.model(slug) },
  ])

  const ldFaq = faqPageSchema(aiContent.faqs)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd id="ld-model" schema={ldCollection} />
      <JsonLd id="ld-model-breadcrumb" schema={ldBreadcrumb} />
      {ldFaq ? <JsonLd id="ld-model-faq" schema={ldFaq} /> : null}

      <header className="mb-8 flex items-start gap-4">
        <ModelIcon name={model.name} slug={model.slug} logo_path={model.logo_path} provider={model.provider} size="lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Model</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#111111]">{model.name}</h1>
          {model.provider && <p className="mt-1 text-sm text-[#999999]">{model.provider}</p>}
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666666]">{description}</p>
        </div>
      </header>

      <section className="mb-8 rounded-2xl border border-[#F0EBE5] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-[#111111]">
          Model overview
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#555555]">
          {aiContent.overview}
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-[#111111]">Strengths</h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-[#555555]">
              {aiContent.strengths.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#111111]">Best prompt types</h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-[#555555]">
              {aiContent.bestPromptTypes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {relatedModels.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-[#111111]">Related models</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {relatedModels.map((item) => (
                  <Link
                    key={item.slug}
                    href={routes.model(item.slug)}
                    className="rounded-full border border-[#E8E3DE] bg-[#FFFCFA] px-3 py-1 text-xs font-medium text-[#666666] hover:border-[#FFB26B] hover:text-[#111111]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {prompts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No prompts for this model yet"
          description="Check back soon - new prompts are added regularly."
        />
      ) : (
        <section>
          <h2 className="mb-4 text-[15px] font-semibold text-[#111111]">
            Popular {model.name} prompts
          </h2>
          <PromptGrid prompts={prompts} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-[15px] font-semibold text-[#111111]">
          {model.name} prompt FAQs
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

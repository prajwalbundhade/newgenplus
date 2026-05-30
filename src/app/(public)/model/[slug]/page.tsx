/**
 * Model landing — /model/[slug]
 * ISR filtered grid + SEO copy.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { getModelBySlug } from '@/features/taxonomy/queries/taxonomy.queries'
import { listPublishedPrompts } from '@/features/prompts/queries/prompt.queries'
import { PromptGrid } from '@/components/prompt/PromptGrid'
import { ModelIcon } from '@/components/prompt/ModelIcon'
import { EmptyState } from '@/components/admin/EmptyState'
import { routes } from '@/config/routes'
import { siteConfig } from '@/config/site'
import { buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema } from '@/lib/seo/schema'

export const revalidate = 120

interface ModelPageProps {
  params: Promise<{ slug: string }>
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
    `Browse the best AI prompts for ${model.name}${model.provider ? ` by ${model.provider}` : ''} on ${siteConfig.name}. Copy curated ${model.name} prompts instantly — free, no account required.`

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

  const prompts = await listPublishedPrompts({ modelSlug: slug, limit: 60 })

  const description =
    model.description?.trim() ||
    `Browse the best AI prompts for ${model.name} on ${siteConfig.name}.`

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd id="ld-model" schema={ldCollection} />
      <JsonLd id="ld-model-breadcrumb" schema={ldBreadcrumb} />
      <header className="mb-8 flex items-start gap-4">
        <ModelIcon name={model.name} slug={model.slug} logo_path={model.logo_path} provider={model.provider} size="lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Model</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#111111]">{model.name}</h1>
          {model.provider && <p className="mt-1 text-sm text-[#999999]">{model.provider}</p>}
          {model.description && (
            <p className="mt-2 max-w-2xl text-sm text-[#666666]">{model.description}</p>
          )}
        </div>
      </header>

      {prompts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No prompts for this model yet"
          description="Check back soon — new prompts are added regularly."
        />
      ) : (
        <PromptGrid prompts={prompts} />
      )}
    </div>
  )
}

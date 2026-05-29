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
import { EmptyState } from '@/components/admin/EmptyState'
import { routes } from '@/config/routes'
import { siteConfig } from '@/config/site'

export const revalidate = 120

interface ModelPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { slug } = await params
  const model = await getModelBySlug(slug)
  if (!model) return { title: 'Model not found' }

  const description =
    model.description ?? `Browse AI prompts for ${model.name} on ${siteConfig.name}.`
  return {
    title: `${model.name} prompts`,
    description,
    alternates: { canonical: routes.model(slug) },
  }
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { slug } = await params
  const model = await getModelBySlug(slug)
  if (!model) notFound()

  const prompts = await listPublishedPrompts({ modelSlug: slug, limit: 60 })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Model</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#111111]">{model.name}</h1>
        {model.provider && <p className="mt-1 text-sm text-[#999999]">{model.provider}</p>}
        {model.description && (
          <p className="mt-2 max-w-2xl text-sm text-[#666666]">{model.description}</p>
        )}
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

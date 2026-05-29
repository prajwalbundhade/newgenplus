/**
 * Category landing — /category/[slug]
 * ISR filtered grid + SEO copy.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { getCategoryBySlug } from '@/features/taxonomy/queries/taxonomy.queries'
import { listPublishedPrompts } from '@/features/prompts/queries/prompt.queries'
import { PromptGrid } from '@/components/prompt/PromptGrid'
import { EmptyState } from '@/components/admin/EmptyState'
import { routes } from '@/config/routes'
import { siteConfig } from '@/config/site'

export const revalidate = 120

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Category not found' }

  const description =
    category.description ?? `Browse ${category.name} AI prompts on ${siteConfig.name}.`
  return {
    title: `${category.name} prompts`,
    description,
    alternates: { canonical: routes.category(slug) },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const prompts = await listPublishedPrompts({ categorySlug: slug, limit: 60 })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Category</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#111111]">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm text-[#666666]">{category.description}</p>
        )}
      </header>

      {prompts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No prompts in this category yet"
          description="Check back soon — new prompts are added regularly."
        />
      ) : (
        <PromptGrid prompts={prompts} />
      )}
    </div>
  )
}

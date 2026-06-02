/**
 * Create prompt — /admin/prompts/new
 * Authorization enforced by the (protected) AdminLayout.
 */

import { PageHeader } from '@/components/admin/PageHeader'
import { PromptForm } from '@/components/admin/PromptForm'
import { Separator } from '@/components/ui/separator'
import { listCategoryOptions, listModelOptions } from '@/features/admin/queries/admin.queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Prompt — NeuwGenX Admin',
  robots: 'noindex, nofollow',
}

export default async function NewPromptPage() {
  const [categories, models] = await Promise.all([
    listCategoryOptions(),
    listModelOptions(),
  ])

  return (
    <div className="min-h-full">
      <PageHeader title="New Prompt" description="Create and publish a new AI prompt." />
      <Separator />
      <div className="px-4 py-5 sm:px-8 sm:py-6">
        <PromptForm mode="create" categories={categories} models={models} />
      </div>
    </div>
  )
}

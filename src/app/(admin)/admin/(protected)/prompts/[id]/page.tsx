/**
 * Edit prompt — /admin/prompts/[id]
 * Authorization enforced by the (protected) AdminLayout.
 */

import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import { PromptForm } from '@/components/admin/PromptForm'
import { Separator } from '@/components/ui/separator'
import {
  getPromptForEdit,
  listCategoryOptions,
  listModelOptions,
} from '@/features/admin/queries/admin.queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Prompt — NewGenPlus Admin',
  robots: 'noindex, nofollow',
}

interface EditPromptPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPromptPage({ params }: EditPromptPageProps) {
  const { id } = await params

  const [detail, categories, models] = await Promise.all([
    getPromptForEdit(id),
    listCategoryOptions(),
    listModelOptions(),
  ])

  if (!detail) {
    notFound()
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="Edit Prompt"
        description={detail.resource.title}
      />
      <Separator />
      <div className="px-8 py-6">
        <PromptForm
          mode="edit"
          categories={categories}
          models={models}
          resource={detail.resource}
          media={detail.media}
        />
      </div>
    </div>
  )
}

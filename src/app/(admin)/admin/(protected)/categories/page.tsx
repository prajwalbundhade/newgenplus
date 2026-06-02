/**
 * Admin categories management — /admin/categories
 * Authorization enforced by the (protected) AdminLayout.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { selectMany } from '@/lib/supabase/query'
import { PageHeader } from '@/components/admin/PageHeader'
import { CategoryManager } from '@/components/admin/CategoryManager'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'
import type { CategoryRow } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Categories — NeuwGenX Admin',
  robots: 'noindex, nofollow',
}

async function getCategories(): Promise<CategoryRow[]> {
  const supabase = createAdminClient()
  return selectMany<CategoryRow>(
    supabase.from('categories').select('*').order('sort_order', { ascending: true })
  )
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-full">
      <PageHeader title="Categories" description="Organise prompts into browsable categories." />
      <Separator />
      <div className="px-4 py-5 sm:px-8 sm:py-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  )
}

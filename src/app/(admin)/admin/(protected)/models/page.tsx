/**
 * Admin models management — /admin/models
 * Authorization enforced by the (protected) AdminLayout.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { selectMany } from '@/lib/supabase/query'
import { PageHeader } from '@/components/admin/PageHeader'
import { ModelManager } from '@/components/admin/ModelManager'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'
import type { ModelRow } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Models — NewGenPlus Admin',
  robots: 'noindex, nofollow',
}

async function getModels(): Promise<ModelRow[]> {
  const supabase = createAdminClient()
  return selectMany<ModelRow>(
    supabase.from('models').select('*').order('name', { ascending: true })
  )
}

export default async function AdminModelsPage() {
  const models = await getModels()

  return (
    <div className="min-h-full">
      <PageHeader title="AI Models" description="Manage the AI models associated with prompts." />
      <Separator />
      <div className="px-4 py-5 sm:px-8 sm:py-6">
        <ModelManager models={models} />
      </div>
    </div>
  )
}

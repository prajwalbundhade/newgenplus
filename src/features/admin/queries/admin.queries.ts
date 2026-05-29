/**
 * Admin read queries.
 *
 * Server-only. Used by admin form pages to populate selects and load a single
 * record for editing. Uses the service-role client (admin context already
 * guarded by the (protected) layout + each action).
 */
import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { selectMany, selectMaybeOne } from '@/lib/supabase/query'
import type {
  ResourceRow,
  ResourceMediaRow,
  CategoryRow,
  ModelRow,
} from '@/types/database.types'

/** Lightweight option used in category/model select dropdowns. */
export interface SelectOption {
  id: string
  name: string
}

export async function listCategoryOptions(): Promise<SelectOption[]> {
  const supabase = createAdminClient()
  const rows = await selectMany<Pick<CategoryRow, 'id' | 'name'>>(
    supabase.from('categories').select('id,name').order('sort_order', { ascending: true })
  )
  return rows
}

export async function listModelOptions(): Promise<SelectOption[]> {
  const supabase = createAdminClient()
  const rows = await selectMany<Pick<ModelRow, 'id' | 'name'>>(
    supabase.from('models').select('id,name').order('name', { ascending: true })
  )
  return rows
}

/** Full resource + its media row, for the edit page. */
export interface AdminPromptDetail {
  resource: ResourceRow
  media: ResourceMediaRow | null
}

export async function getPromptForEdit(id: string): Promise<AdminPromptDetail | null> {
  const supabase = createAdminClient()

  const resource = await selectMaybeOne<ResourceRow>(
    supabase.from('resources').select('*').eq('id', id).single()
  )
  if (!resource) return null

  const media = await selectMaybeOne<ResourceMediaRow>(
    supabase.from('resource_media').select('*').eq('resource_id', id).maybeSingle()
  )

  return { resource, media }
}

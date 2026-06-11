'use server'

/**
 * Model admin Server Actions — create / update / delete.
 *
 * Authorization: guardAdmin() on every action.
 * Data access: service-role client (admin context).
 */

import { revalidatePath } from 'next/cache'
import { guardAdmin } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { selectMaybeOne, selectOne, writePayload } from '@/lib/supabase/query'
import { type ActionResult, ok, fail } from '@/lib/action-result'
import { slugify } from '@/lib/utils/slug'  // ← changed from uniqueSlug to slugify
import {
  ModelCreateSchema,
  ModelUpdateSchema,
} from '@/features/admin/schemas/taxonomy.schema'
import type { ModelRow } from '@/types/database.types'

type ModelRevalidationInfo = Pick<ModelRow, 'slug' | 'status'>

function revalidateModelPublicSurfaces(
  ...models: Array<ModelRevalidationInfo | null | undefined>
) {
  const publishedModels = models.filter(
    (model): model is ModelRevalidationInfo => model?.status === 'published'
  )

  if (publishedModels.length === 0) return

  const paths = new Set<string>(['/'])
  for (const model of publishedModels) {
    paths.add(`/model/${model.slug}`)
  }
  for (const path of paths) revalidatePath(path)
}

function formToObject(formData: FormData) {
  return {
    name: formData.get('name') ?? undefined,
    description: formData.get('description') ?? undefined,
    provider: formData.get('provider') ?? undefined,
    logo_path: formData.has('logo_path') ? formData.get('logo_path') ?? '' : undefined,
    status: formData.get('status') || undefined,
  }
}

function collectFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) fieldErrors[issue.path.map(String).join('.')] = issue.message
  return fieldErrors
}

export async function createModel(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await guardAdmin()

  const parsed = ModelCreateSchema.safeParse(formToObject(formData))
  if (!parsed.success) {
    return fail('Please correct the highlighted fields.', collectFieldErrors(parsed.error.issues))
  }

  const input = parsed.data
  const supabase = createAdminClient()

  // Generate clean slug from name
  const slug = slugify(input.name)

  // Check uniqueness before inserting
  const { data: existing } = await supabase
    .from('models')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return fail('A model with this name already exists. Please use a different name.')
  }

  try {
    const created = await selectOne<ModelRow>(
      supabase
        .from('models')
        .insert(
          writePayload({
            name: input.name,
            slug,  // ← clean slug, no random suffix
            description: input.description || null,
            provider: input.provider || null,
            logo_path: input.logo_path || null,
            status: input.status,
          })
        )
        .select('*')
        .single()
    )
    revalidateModelPublicSurfaces(created)
    return ok({ id: created.id })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to create model.')
  }
}

export async function updateModel(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await guardAdmin()

  const parsed = ModelUpdateSchema.safeParse({
    ...formToObject(formData),
    id: formData.get('id'),
  })
  if (!parsed.success) {
    return fail('Please correct the highlighted fields.', collectFieldErrors(parsed.error.issues))
  }

  const { id, ...fields } = parsed.data
  const supabase = createAdminClient()

  const update: Record<string, unknown> = {
    ...(fields.name !== undefined && { name: fields.name }),
    ...(fields.description !== undefined && { description: fields.description || null }),
    ...(fields.provider !== undefined && { provider: fields.provider || null }),
    ...(fields.logo_path !== undefined && { logo_path: fields.logo_path || null }),
    ...(fields.status !== undefined && { status: fields.status }),
  }

  try {
    const current = await selectMaybeOne<ModelRevalidationInfo>(
      supabase.from('models').select('slug,status').eq('id', id).maybeSingle()
    )
    if (!current) return fail('Model not found.')

    const updated = await selectOne<ModelRow>(
      supabase.from('models').update(writePayload(update)).eq('id', id).select('*').single()
    )
    revalidateModelPublicSurfaces(current, updated)
    return ok({ id: updated.id })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to update model.')
  }
}

export async function deleteModel(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const current = await selectMaybeOne<ModelRevalidationInfo>(
      supabase.from('models').select('slug,status').eq('id', id).maybeSingle()
    )
    if (!current) return fail('Model not found.')

    const { error } = await supabase.from('models').delete().eq('id', id)
    if (error) return fail(error.message)
    revalidateModelPublicSurfaces(current)
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to delete model.')
  }
}

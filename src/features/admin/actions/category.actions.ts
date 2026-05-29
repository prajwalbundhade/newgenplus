'use server'

/**
 * Category admin Server Actions — create / update / delete.
 *
 * Authorization: guardAdmin() on every action.
 * Data access: service-role client (admin context).
 * Returns typed ActionResult; revalidates affected surfaces.
 */

import { revalidatePath } from 'next/cache'
import { guardAdmin } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { selectOne, writePayload } from '@/lib/supabase/query'
import { type ActionResult, ok, fail } from '@/lib/action-result'
import { uniqueSlug } from '@/lib/utils/slug'
import {
  CategoryCreateSchema,
  CategoryUpdateSchema,
} from '@/features/admin/schemas/taxonomy.schema'
import type { CategoryRow } from '@/types/database.types'

function revalidateCategorySurfaces() {
  revalidatePath('/admin/categories')
  revalidatePath('/admin')
  revalidatePath('/')
}

function formToObject(formData: FormData) {
  return {
    name: formData.get('name') ?? undefined,
    description: formData.get('description') ?? undefined,
    icon: formData.get('icon') ?? undefined,
    sort_order: formData.get('sort_order') ?? 0,
    status: formData.get('status') || undefined,
  }
}

function collectFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) fieldErrors[issue.path.map(String).join('.')] = issue.message
  return fieldErrors
}

export async function createCategory(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await guardAdmin()

  const parsed = CategoryCreateSchema.safeParse(formToObject(formData))
  if (!parsed.success) {
    return fail('Please correct the highlighted fields.', collectFieldErrors(parsed.error.issues))
  }

  const input = parsed.data
  const supabase = createAdminClient()

  try {
    const created = await selectOne<CategoryRow>(
      supabase
        .from('categories')
        .insert(
          writePayload({
            name: input.name,
            slug: uniqueSlug(input.name),
            description: input.description || null,
            icon: input.icon || null,
            sort_order: input.sort_order,
            status: input.status,
          })
        )
        .select('*')
        .single()
    )
    revalidateCategorySurfaces()
    return ok({ id: created.id })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to create category.')
  }
}

export async function updateCategory(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await guardAdmin()

  const parsed = CategoryUpdateSchema.safeParse({
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
    ...(fields.icon !== undefined && { icon: fields.icon || null }),
    ...(fields.sort_order !== undefined && { sort_order: fields.sort_order }),
    ...(fields.status !== undefined && { status: fields.status }),
  }

  try {
    const updated = await selectOne<CategoryRow>(
      supabase.from('categories').update(writePayload(update)).eq('id', id).select('*').single()
    )
    revalidateCategorySurfaces()
    return ok({ id: updated.id })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to update category.')
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return fail(error.message)
    revalidateCategorySurfaces()
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to delete category.')
  }
}

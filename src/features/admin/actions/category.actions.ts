'use server'

import { revalidatePath } from 'next/cache'
import { guardAdmin } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { selectMaybeOne, selectOne, writePayload } from '@/lib/supabase/query'
import { type ActionResult, ok, fail } from '@/lib/action-result'
import { slugify } from '@/lib/utils/slug'  // ← changed from uniqueSlug to slugify
import {
  CategoryCreateSchema,
  CategoryUpdateSchema,
} from '@/features/admin/schemas/taxonomy.schema'
import type { CategoryRow } from '@/types/database.types'

type CategoryRevalidationInfo = Pick<CategoryRow, 'slug' | 'status'>

function revalidateCategoryPublicSurfaces(
  ...categories: Array<CategoryRevalidationInfo | null | undefined>
) {
  const publishedCategories = categories.filter(
    (category): category is CategoryRevalidationInfo => category?.status === 'published'
  )

  if (publishedCategories.length === 0) return

  const paths = new Set<string>(['/'])
  for (const category of publishedCategories) {
    paths.add(`/category/${category.slug}`)
  }
  for (const path of paths) revalidatePath(path)
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

  // Generate clean slug from name
  const slug = slugify(input.name)

  // Check uniqueness before inserting
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return fail('A category with this name already exists. Please use a different name.')
  }

  try {
    const created = await selectOne<CategoryRow>(
      supabase
        .from('categories')
        .insert(
          writePayload({
            name: input.name,
            slug,  // ← clean slug, no random suffix
            description: input.description || null,
            icon: input.icon || null,
            sort_order: input.sort_order,
            status: input.status,
          })
        )
        .select('*')
        .single()
    )
    revalidateCategoryPublicSurfaces(created)
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
    const current = await selectMaybeOne<CategoryRevalidationInfo>(
      supabase.from('categories').select('slug,status').eq('id', id).maybeSingle()
    )
    if (!current) return fail('Category not found.')

    const updated = await selectOne<CategoryRow>(
      supabase.from('categories').update(writePayload(update)).eq('id', id).select('*').single()
    )
    revalidateCategoryPublicSurfaces(current, updated)
    return ok({ id: updated.id })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to update category.')
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  await guardAdmin()
  const supabase = createAdminClient()

  try {
    const current = await selectMaybeOne<CategoryRevalidationInfo>(
      supabase.from('categories').select('slug,status').eq('id', id).maybeSingle()
    )
    if (!current) return fail('Category not found.')

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return fail(error.message)
    revalidateCategoryPublicSurfaces(current)
    return ok(undefined)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to delete category.')
  }
}

'use client'

/**
 * CategoryManager — client island for category CRUD.
 *
 * Receives the initial list from the server page, then performs create/edit/
 * delete via real server actions, refreshing the route after each mutation.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react'
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/features/admin/actions/category.actions'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CategoryRow, ContentStatus } from '@/types/database.types'

interface CategoryManagerProps {
  categories: CategoryRow[]
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(category: CategoryRow) {
    setEditing(category)
    setError(null)
    setDialogOpen(true)
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = editing
        ? await updateCategory(formData)
        : await createCategory(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDialogOpen(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (!result.ok) {
        window.alert(result.error)
        return
      }
      setConfirmDelete(null)
      router.refresh()
    })
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus size={15} />
          New Category
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#F0EBE5] bg-white">
        <div className="border-b border-[#F0EBE5] px-5 py-3">
          <span className="text-xs font-medium text-[#999999]">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category, i) => (
              <TableRow key={category.id}>
                <TableCell className="tabular-nums text-[#999999]">{i + 1}</TableCell>
                <TableCell>
                  <p className="font-medium text-[#111111]">{category.name}</p>
                  {category.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#999999]">{category.description}</p>
                  )}
                </TableCell>
                <TableCell>
                  <code className="rounded bg-[#FFF9F5] px-1.5 py-0.5 text-xs text-[#FF6B35]">
                    {category.slug}
                  </code>
                </TableCell>
                <TableCell>
                  <StatusBadge status={category.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      className="rounded-md p-1.5 text-[#999999] transition-colors hover:bg-[#FFF9F5] hover:text-[#FF6B35]"
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmDelete === category.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleDelete(category.id)}
                          className="rounded-md bg-[#FEF2F2] px-2 py-1 text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] disabled:opacity-50"
                        >
                          {pending ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-md px-2 py-1 text-xs text-[#666666] hover:bg-[#FFF9F5]"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(category.id)}
                        className="rounded-md p-1.5 text-[#999999] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Edit Category' : 'New Category'}
        description={editing ? editing.name : 'Add a new browsable category.'}
      >
        <form action={handleSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-3 py-2.5">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-[#DC2626]" />
              <p className="text-xs text-[#DC2626]">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input name="name" defaultValue={editing?.name} placeholder="Portrait" required />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              name="description"
              defaultValue={editing?.description ?? ''}
              placeholder="Stunning AI portrait prompts."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <Input name="icon" defaultValue={editing?.icon ?? ''} placeholder="user" />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input name="sort_order" type="number" min={0} defaultValue={editing?.sort_order ?? 0} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select name="status" defaultValue={editing?.status ?? 'published'}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="md" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={pending}>
              {pending ? <Loader2 size={15} className="animate-spin" /> : editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const map: Record<ContentStatus, { label: string; variant: 'success' | 'secondary' | 'danger' }> = {
    published: { label: 'Published', variant: 'success' },
    draft: { label: 'Draft', variant: 'secondary' },
    archived: { label: 'Archived', variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

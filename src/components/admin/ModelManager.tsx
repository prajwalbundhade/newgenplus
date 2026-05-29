'use client'

/**
 * ModelManager — client island for model CRUD.
 * Mirrors CategoryManager: server-provided list + real action mutations.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Cpu } from 'lucide-react'
import {
  createModel,
  updateModel,
  deleteModel,
} from '@/features/admin/actions/model.actions'
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
import type { ModelRow, ContentStatus } from '@/types/database.types'

interface ModelManagerProps {
  models: ModelRow[]
}

export function ModelManager({ models }: ModelManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ModelRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(model: ModelRow) {
    setEditing(model)
    setError(null)
    setDialogOpen(true)
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = editing ? await updateModel(formData) : await createModel(formData)
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
      const result = await deleteModel(id)
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
          New Model
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#F0EBE5] bg-white">
        <div className="border-b border-[#F0EBE5] px-5 py-3">
          <span className="text-xs font-medium text-[#999999]">
            {models.length} {models.length === 1 ? 'model' : 'models'}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#F0EBE5] bg-[#FFF9F5]">
                      <Cpu size={14} className="text-[#999999]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#111111]">{model.name}</p>
                      {model.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#999999]">{model.description}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {model.provider ? (
                    <span className="text-sm text-[#666666]">{model.provider}</span>
                  ) : (
                    <span className="text-xs text-[#999999]">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <code className="rounded bg-[#FFF9F5] px-1.5 py-0.5 text-xs text-[#FF6B35]">
                    {model.slug}
                  </code>
                </TableCell>
                <TableCell>
                  <StatusBadge status={model.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(model)}
                      className="rounded-md p-1.5 text-[#999999] transition-colors hover:bg-[#FFF9F5] hover:text-[#FF6B35]"
                      aria-label={`Edit ${model.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmDelete === model.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleDelete(model.id)}
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
                        onClick={() => setConfirmDelete(model.id)}
                        className="rounded-md p-1.5 text-[#999999] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                        aria-label={`Delete ${model.name}`}
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
        title={editing ? 'Edit Model' : 'New Model'}
        description={editing ? editing.name : 'Add an AI model.'}
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
            <Input name="name" defaultValue={editing?.name} placeholder="Midjourney v6" required />
          </div>

          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Input name="provider" defaultValue={editing?.provider ?? ''} placeholder="Midjourney" />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              name="description"
              defaultValue={editing?.description ?? ''}
              placeholder="The latest Midjourney model with photorealistic quality."
              rows={2}
            />
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
    draft:     { label: 'Draft',     variant: 'secondary' },
    archived:  { label: 'Archived',  variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

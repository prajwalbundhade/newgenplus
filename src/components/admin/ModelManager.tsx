'use client'

/**
 * ModelManager — client island for model CRUD.
 * Mirrors CategoryManager: server-provided list + real action mutations.
 *
 * Logos: each model has its own `logo_path`, stored as a base64 PNG data URL
 * in the DB. The dialog lets an admin upload, replace, or clear that image;
 * the picked file is rasterised client-side to a 192px-square PNG data URL
 * before being submitted (so we avoid storing oversize originals and SVGs
 * stay sandbox-safe).
 */

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Upload, X } from 'lucide-react'
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
import { ModelIcon } from '@/components/prompt/ModelIcon'
import { fileToLogoDataUrl } from '@/lib/image-to-data-url'
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

/**
 * Logo state machine inside the dialog:
 *   - 'unchanged'  → don't send `logo_path` (server keeps existing value)
 *   - 'cleared'    → send empty string (server sets logo_path = null)
 *   - 'replaced'   → send the new data URL
 */
type LogoState =
  | { kind: 'unchanged' }
  | { kind: 'cleared' }
  | { kind: 'replaced'; dataUrl: string }

const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_LOGO_FILE_BYTES = 2 * 1024 * 1024 // 2 MB original; we down-rasterise after.

export function ModelManager({ models }: ModelManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ModelRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Logo dialog state — reset whenever the dialog opens.
  const [logoState, setLogoState] = useState<LogoState>({ kind: 'unchanged' })
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoEncoding, setLogoEncoding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function openCreate() {
    setEditing(null)
    setError(null)
    setLogoState({ kind: 'unchanged' })
    setLogoError(null)
    setDialogOpen(true)
  }

  function openEdit(model: ModelRow) {
    setEditing(model)
    setError(null)
    setLogoState({ kind: 'unchanged' })
    setLogoError(null)
    setDialogOpen(true)
  }

  /** Resolve the logo currently displayed in the dialog preview. */
  function previewLogo(): string | null {
    if (logoState.kind === 'replaced') return logoState.dataUrl
    if (logoState.kind === 'cleared') return null
    return editing?.logo_path ?? null
  }

  async function handleLogoFile(file: File | undefined | null) {
    setLogoError(null)
    if (!file) return

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError('Use PNG, JPEG, WebP, GIF, or SVG.')
      return
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      setLogoError('Logo file is too large. Pick something under 2 MB.')
      return
    }

    setLogoEncoding(true)
    try {
      const dataUrl = await fileToLogoDataUrl(file)
      setLogoState({ kind: 'replaced', dataUrl })
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Could not read image.')
    } finally {
      setLogoEncoding(false)
    }
  }

  function clearLogo() {
    setLogoError(null)
    setLogoState({ kind: 'cleared' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit(formData: FormData) {
    setError(null)

    // Sync logo intent into the FormData so the server action sees it.
    if (logoState.kind === 'replaced') {
      formData.set('logo_path', logoState.dataUrl)
    } else if (logoState.kind === 'cleared') {
      formData.set('logo_path', '')
    } else {
      formData.delete('logo_path')
    }

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

  const dialogPreview = previewLogo()

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
              <TableHead className="hidden md:table-cell">Provider</TableHead>
              <TableHead className="hidden lg:table-cell">Slug</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ModelIcon
                      name={model.name}
                      slug={model.slug}
                      provider={model.provider}
                      logo_path={model.logo_path}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-[#111111]">{model.name}</p>
                      {model.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#999999]">{model.description}</p>
                      )}
                      {/* Mobile-only inline meta */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
                        <StatusBadge status={model.status} />
                        {model.provider && (
                          <span className="text-[11px] text-[#999999]">{model.provider}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {model.provider ? (
                    <span className="text-sm text-[#666666]">{model.provider}</span>
                  ) : (
                    <span className="text-xs text-[#999999]">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <code className="rounded bg-[#FFF9F5] px-1.5 py-0.5 text-xs text-[#FF6B35]">
                    {model.slug}
                  </code>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
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

          {/* Logo uploader */}
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#F0EBE5] bg-[#FAFAFA]"
                aria-hidden
              >
                {dialogPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dialogPreview}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] font-medium text-[#999999]">No logo</span>
                )}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={logoEncoding || pending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoEncoding ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  {dialogPreview ? 'Replace' : 'Upload'}
                </Button>
                {dialogPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={logoEncoding || pending}
                    onClick={clearLogo}
                  >
                    <X size={13} />
                    Remove
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_LOGO_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  void handleLogoFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
            {logoError ? (
              <p className="text-xs text-[#DC2626]">{logoError}</p>
            ) : (
              <p className="text-xs text-[#999999]">
                PNG, JPEG, WebP, GIF, or SVG. Resized to a 192&times;192 PNG before saving.
              </p>
            )}
          </div>

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
            <Button type="submit" variant="primary" size="md" disabled={pending || logoEncoding}>
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

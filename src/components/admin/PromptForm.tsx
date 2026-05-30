'use client'

/**
 * PromptForm — create/edit a prompt with image upload.
 *
 * Flow:
 *   1. On submit, create/update the resource via the server action.
 *   2. If a new image file is selected, process it client-side (dimensions +
 *      blur), then upload via attachPromptImage using the returned resource id.
 *   3. Redirect back to the prompts list on success.
 *
 * No mock data — category/model options and existing values come from props
 * loaded server-side.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { UploadCloud, AlertCircle, Loader2, X } from 'lucide-react'
import { createPrompt, updatePrompt, attachPromptImage } from '@/features/prompts/actions/prompt.actions'
import { processImageFile } from '@/lib/image-processing'
import { publicStorageUrl } from '@/lib/supabase/storage'
import { MAX_IMAGE_BYTES, MAX_IMAGE_LABEL, ACCEPTED_IMAGE_TYPES } from '@/config/upload'
import type { SelectOption } from '@/features/admin/queries/admin.queries'
import type { ResourceRow, ResourceMediaRow } from '@/types/database.types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { TagInput } from '@/components/ui/tag-input'
import { cn } from '@/lib/utils'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface PromptFormProps {
  mode: 'create' | 'edit'
  categories: SelectOption[]
  models: SelectOption[]
  resource?: ResourceRow
  media?: ResourceMediaRow | null
}

export function PromptForm({ mode, categories, models, resource, media }: PromptFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [isFeatured, setIsFeatured] = useState(resource?.is_featured ?? false)
  const [status, setStatus] = useState<ResourceRow['status']>(resource?.status ?? 'draft')

  // Image state
  const existingImageUrl =
    media?.storage_bucket && media?.storage_path
      ? publicStorageUrl(media.storage_bucket, media.storage_path)
      : null
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl)
  const [imageError, setImageError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  /** Validate and accept a file (shared by file input + drag-drop). */
  function selectFile(selected: File | null | undefined) {
    if (!selected) return
    setImageError(null)

    const typeOk =
      selected.type.startsWith('image/') &&
      (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(selected.type)
    if (!typeOk) {
      setImageError('Unsupported file type. Use JPEG, PNG, WebP, AVIF, or GIF.')
      return
    }

    if (selected.size > MAX_IMAGE_BYTES) {
      setImageError(
        `That image is ${formatBytes(selected.size)}. Please upload an image under ${MAX_IMAGE_LABEL}.`
      )
      return
    }

    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    selectFile(e.target.files?.[0])
    // Reset the input so re-selecting the same file still fires onChange.
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragActive(false)
    selectFile(e.dataTransfer.files?.[0])
  }

  function clearImage() {
    setFile(null)
    setPreviewUrl(null)
    setImageError(null)
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    setFieldErrors({})

    // Block submission if the selected image failed validation.
    if (imageError) {
      setError('Please fix the cover image before saving.')
      return
    }

    // Sync controlled fields into the FormData.
    formData.set('status', status)
    formData.set('is_featured', isFeatured ? 'true' : 'false')

    startTransition(async () => {
      // 1. Create or update the resource.
      const result =
        mode === 'create'
          ? await createPrompt(formData)
          : await updatePrompt(formData)

      if (!result.ok) {
        setError(result.error)
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
        return
      }

      // 2. Upload image if a new file was chosen.
      if (file) {
        try {
          const processed = await processImageFile(file)
          const imageData = new FormData()
          imageData.set('resource_id', result.data.id)
          imageData.set('file', file)
          imageData.set('width', String(processed.width))
          imageData.set('height', String(processed.height))
          imageData.set('blur_data_url', processed.blurDataUrl)

          const uploadResult = await attachPromptImage(imageData)
          if (!uploadResult.ok) {
            setError(`Prompt saved, but image upload failed: ${uploadResult.error}`)
            return
          }
        } catch (err) {
          setError(
            `Prompt saved, but image processing failed: ${
              err instanceof Error ? err.message : 'unknown error'
            }`
          )
          return
        }
      }

      // 3. Done — back to the list.
      router.push('/admin/prompts')
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {mode === 'edit' && resource && (
        <input type="hidden" name="id" value={resource.id} />
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#DC2626]" />
          <p className="text-sm text-[#DC2626]">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Left: content fields ── */}
        <div className="space-y-5">
          <Field label="Title" error={fieldErrors.title} required>
            <Input
              name="title"
              defaultValue={resource?.title}
              placeholder="Golden Hour Portrait — Cinematic Realism"
              required
            />
          </Field>

          <Field label="Prompt text" error={fieldErrors.prompt_text} hint="The copyable content shown to users." required>
            <Textarea
              name="prompt_text"
              defaultValue={resource?.prompt_text ?? ''}
              placeholder="Portrait of a woman at golden hour, cinematic lighting…"
              rows={6}
              required
            />
          </Field>

          <Field label="Description" error={fieldErrors.description} hint="Supporting copy for SEO and the detail page.">
            <Textarea
              name="description"
              defaultValue={resource?.description ?? ''}
              placeholder="A breathtaking golden hour portrait with cinematic depth of field."
              rows={3}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Category" error={fieldErrors.category_id} required>
              <Select name="category_id" defaultValue={resource?.category_id ?? ''} required>
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Model" error={fieldErrors.model_id} required>
              <Select name="model_id" defaultValue={resource?.model_id ?? ''} required>
                <option value="">Select a model…</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Creator name">
              <Input
                name="creator_name"
                defaultValue={resource?.creator_name ?? 'NewGenPlus'}
                placeholder="NewGenPlus"
              />
            </Field>

            <Field label="Tags" hint="Type a tag and press Enter. Click ✕ to remove.">
              <TagInput
                name="tags"
                defaultValue={resource?.tags ?? []}
                placeholder="e.g. portrait, cinematic…"
              />
            </Field>
          </div>
        </div>

        {/* ── Right: media + publish controls ── */}
        <div className="space-y-5">
          {/* Image uploader */}
          <div className="space-y-1.5">
            <Label>Cover image</Label>
            <label
              htmlFor="image-file"
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setDragActive(false)
              }}
              onDrop={handleDrop}
              className={cn(
                'group relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-white transition-colors',
                dragActive
                  ? 'border-[#FF6B35] bg-[#FFF0E8]'
                  : imageError
                    ? 'border-[#FCA5A5]'
                    : 'border-[#E5DDD6] hover:border-[#FFB26B]'
              )}
            >
              {previewUrl ? (
                <>
                  <Image
                    src={previewUrl}
                    alt="Prompt cover preview"
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="320px"
                  />
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      clearImage()
                    }}
                    aria-label="Remove image"
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75"
                  >
                    <X size={14} />
                  </button>
                  {/* Hover hint to replace */}
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="mb-3 text-xs font-medium text-white">Click or drop to replace</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center">
                  <UploadCloud size={24} className={dragActive ? 'text-[#FF6B35]' : 'text-[#999999]'} />
                  <span className="text-xs font-medium text-[#666666]">
                    {dragActive ? 'Drop image to upload' : 'Click or drag & drop to upload'}
                  </span>
                  <span className="text-[10px] text-[#999999]">
                    JPEG, PNG, WebP · up to {MAX_IMAGE_LABEL}
                  </span>
                </div>
              )}
            </label>
            <input
              id="image-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* File meta / error */}
            {imageError ? (
              <div
                role="alert"
                className="flex items-start gap-1.5 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-3 py-2"
              >
                <AlertCircle size={13} className="mt-0.5 shrink-0 text-[#DC2626]" />
                <p className="text-xs text-[#DC2626]">{imageError}</p>
              </div>
            ) : file ? (
              <p className="truncate text-xs text-[#999999]">
                {file.name} · {formatBytes(file.size)}
              </p>
            ) : null}
          </div>

          {/* Status */}
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ResourceRow['status'])}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>

          {/* Featured */}
          <div className="flex items-center justify-between rounded-lg border border-[#F0EBE5] bg-white px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#111111]">Featured</p>
              <p className="text-xs text-[#999999]">Show in the homepage featured row.</p>
            </div>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} aria-label="Featured" />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
              {pending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving…
                </>
              ) : mode === 'create' ? (
                'Create prompt'
              ) : (
                'Save changes'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={pending}
              className="w-full"
              onClick={() => router.push('/admin/prompts')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

// ── Field wrapper ──────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-[#FF6B35]">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-[#999999]">{hint}</p>}
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  )
}

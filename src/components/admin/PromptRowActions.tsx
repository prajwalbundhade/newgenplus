'use client'

/**
 * PromptRowActions — per-row admin controls for a prompt.
 *
 * Edit (link), publish/unpublish, feature toggle, delete — all wired to the
 * real server actions. Uses useTransition for pending state and router.refresh
 * to re-render the server list after a mutation.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Pencil,
  Star,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
} from 'lucide-react'
import {
  setPromptStatus,
  toggleFeatured,
  deletePrompt,
} from '@/features/prompts/actions/prompt.actions'
import { routes } from '@/config/routes'
import { cn } from '@/lib/utils'
import type { ResourceRow } from '@/types/database.types'

interface PromptRowActionsProps {
  id: string
  title: string
  status: ResourceRow['status']
  isFeatured: boolean
}

export function PromptRowActions({ id, title, status, isFeatured }: PromptRowActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const isPublished = status === 'published'

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) {
        window.alert(result.error ?? 'Action failed.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Featured toggle */}
      <IconButton
        label={isFeatured ? 'Unfeature' : 'Feature'}
        active={isFeatured}
        disabled={pending}
        onClick={() => run(() => toggleFeatured(id, !isFeatured))}
      >
        <Star size={14} className={isFeatured ? 'fill-[#FF6B35] text-[#FF6B35]' : ''} />
      </IconButton>

      {/* Publish / unpublish */}
      <IconButton
        label={isPublished ? 'Unpublish (set draft)' : 'Publish'}
        disabled={pending}
        onClick={() => run(() => setPromptStatus(id, isPublished ? 'draft' : 'published'))}
      >
        {isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
      </IconButton>

      {/* Edit */}
      <Link
        href={routes.admin.prompts + `/${id}`}
        className="rounded-md p-1.5 text-[#999999] transition-colors hover:bg-[#FFF9F5] hover:text-[#FF6B35]"
        aria-label={`Edit ${title}`}
      >
        <Pencil size={14} />
      </Link>

      {/* Delete */}
      {confirmingDelete ? (
        <span className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => deletePrompt(id))}
            className="rounded-md bg-[#FEF2F2] px-2 py-1 text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] disabled:opacity-50"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmingDelete(false)}
            className="rounded-md px-2 py-1 text-xs text-[#666666] hover:bg-[#FFF9F5]"
          >
            Cancel
          </button>
        </span>
      ) : (
        <IconButton
          label={`Delete ${title}`}
          disabled={pending}
          danger
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 size={14} />
        </IconButton>
      )}
    </div>
  )
}

function IconButton({
  label,
  active,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  danger?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-md p-1.5 transition-colors disabled:opacity-50',
        danger
          ? 'text-[#999999] hover:bg-[#FEF2F2] hover:text-[#DC2626]'
          : active
            ? 'text-[#FF6B35] hover:bg-[#FFF0E8]'
            : 'text-[#999999] hover:bg-[#FFF9F5] hover:text-[#FF6B35]'
      )}
    >
      {children}
    </button>
  )
}

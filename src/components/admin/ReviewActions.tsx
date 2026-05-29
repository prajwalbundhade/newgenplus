'use client'

/**
 * ReviewActions — approve / reject / delete controls for a single review.
 * Wired to the real moderation server actions.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react'
import {
  approveReview,
  rejectReview,
  deleteReview,
} from '@/features/admin/actions/review.actions'
import { Button } from '@/components/ui/button'
import type { ReviewStatus } from '@/types/database.types'

interface ReviewActionsProps {
  id: string
  status: ReviewStatus
  /** compact = icon-only buttons for the list rows */
  compact?: boolean
}

export function ReviewActions({ id, status, compact = false }: ReviewActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  if (compact) {
    return (
      <div className="flex items-center justify-end gap-1">
        {status !== 'approved' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => approveReview(id))}
            aria-label="Approve"
            title="Approve"
            className="rounded-md p-1.5 text-[#999999] transition-colors hover:bg-[#F0FDF4] hover:text-[#16A34A] disabled:opacity-50"
          >
            <CheckCircle size={14} />
          </button>
        )}
        {status !== 'rejected' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => rejectReview(id))}
            aria-label="Reject"
            title="Reject"
            className="rounded-md p-1.5 text-[#999999] transition-colors hover:bg-[#FFFBEB] hover:text-[#D97706] disabled:opacity-50"
          >
            <XCircle size={14} />
          </button>
        )}
        {confirmDelete ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteReview(id))}
              className="rounded-md bg-[#FEF2F2] px-2 py-1 text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] disabled:opacity-50"
            >
              {pending ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-2 py-1 text-xs text-[#666666] hover:bg-[#FFF9F5]"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete"
            title="Delete"
            className="rounded-md p-1.5 text-[#999999] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626] disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    )
  }

  // Full buttons (pending queue cards)
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => approveReview(id))}>
        {pending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
        Approve
      </Button>
      <Button variant="danger" size="sm" disabled={pending} onClick={() => run(() => rejectReview(id))}>
        <XCircle size={13} />
        Reject
      </Button>
    </div>
  )
}

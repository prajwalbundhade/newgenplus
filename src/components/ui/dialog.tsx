'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * Lightweight accessible modal dialog. Portal-based, no dependency.
 * Closes on overlay click and Escape. Locks body scroll while open.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#111111]/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border border-[#F0EBE5] bg-white shadow-[0_20px_60px_-15px_rgb(0_0_0/0.2)]',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#F0EBE5] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#111111]">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-[#666666]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#999999] transition-colors hover:bg-[#FFF9F5] hover:text-[#111111]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}

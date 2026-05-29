'use client'

/**
 * CopyButton — copies the prompt text and increments the copy counter.
 *
 * Copy happens instantly client-side; the counter increment is fire-and-forget
 * so it never blocks the UX. Dedup is intentionally light — each explicit click
 * is a real copy intent and counts.
 */

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { incrementCopy } from '@/features/prompts/actions/counter.actions'
import { getSessionId } from '@/lib/session-id'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  resourceId: string
  text: string
  className?: string
}

export function CopyButton({ resourceId, text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      // Fire-and-forget counter increment.
      void incrementCopy(resourceId, getSessionId())
    } catch {
      // Clipboard can fail on insecure origins; ignore silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium h-11',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2',
        copied
          ? 'bg-[#16A34A] text-white'
          : 'bg-[#FF6B35] text-white hover:bg-[#FF8A4C] active:bg-[#e55a25]',
        className
      )}
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check size={16} />
          Copied
        </>
      ) : (
        <>
          <Copy size={16} />
          Copy prompt
        </>
      )}
    </button>
  )
}

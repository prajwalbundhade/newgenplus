'use client'

/**
 * CopyEmailButton — copies the contact email to clipboard with visual feedback.
 */

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyEmailButtonProps {
  email: string
}

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = email
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [email])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E3DE] bg-white px-3 py-2 text-sm font-medium text-[#4A3F3A] transition-all hover:border-[#FF6B35] hover:bg-[#FFF6F2] hover:text-[#FF6B35] active:scale-95"
      aria-label={copied ? 'Email copied' : 'Copy email to clipboard'}
    >
      {copied ? (
        <>
          <Check size={14} className="text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={14} />
          <span>Copy email</span>
        </>
      )}
    </button>
  )
}

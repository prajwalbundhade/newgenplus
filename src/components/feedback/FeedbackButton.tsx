'use client'

/**
 * FeedbackButton — header button that opens the feedback modal.
 *
 * Replaces the static Link in PublicHeader with an interactive trigger.
 */

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { FeedbackModal } from './FeedbackModal'

export function FeedbackButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          group hidden shrink-0 items-center gap-1.5 whitespace-nowrap
          rounded-[10px] border-[1.5px] border-[#D9CFC7] bg-white
          px-[15px] text-[13px] font-medium text-[#4A3F3A]
          transition-colors hover:border-[#FF6B35] hover:bg-[#FFF6F2]
          hover:text-[#FF6B35] sm:flex cursor-pointer
        "
        style={{ height: 37 }}
        aria-label="Give feedback"
      >
        <MessageCircle
          size={15}
          className="text-[#FF6B35] transition-colors"
        />
        Give feedback
      </button>

      {/* Mobile trigger — icon only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E3DE] bg-white text-[#FF6B35] transition-colors hover:bg-[#FFF6F2] sm:hidden"
        aria-label="Give feedback"
      >
        <MessageCircle size={16} />
      </button>

      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

'use client'

/**
 * LikeButton — heart toggle that likes/unlikes a prompt.
 *
 * The liked state is persisted per-browser in localStorage so a user's like
 * survives reloads and can't be double-counted. The count updates optimistically
 * and the counter RPC runs fire-and-forget (it never blocks the UI).
 *
 * Variants:
 *   - 'button'  : pill button with label (detail page)
 *   - 'inline'  : compact icon + count (cards / stat rows)
 */

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { likePrompt, unlikePrompt } from '@/features/prompts/actions/counter.actions'
import { getSessionId } from '@/lib/session-id'
import { formatCount } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  resourceId: string
  initialCount: number
  variant?: 'button' | 'inline'
  className?: string
}

const STORAGE_PREFIX = 'ngp_liked_'

export function LikeButton({
  resourceId,
  initialCount,
  variant = 'inline',
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)

  // Hydrate liked state from localStorage on mount.
  useEffect(() => {
    try {
      setLiked(window.localStorage.getItem(STORAGE_PREFIX + resourceId) === '1')
    } catch {
      // ignore storage errors
    }
  }, [resourceId])

  function toggle(e: React.MouseEvent) {
    // When used inside a clickable card, don't trigger the card link.
    e.preventDefault()
    e.stopPropagation()

    const next = !liked
    setLiked(next)
    setCount((c) => Math.max(0, c + (next ? 1 : -1)))

    try {
      if (next) window.localStorage.setItem(STORAGE_PREFIX + resourceId, '1')
      else window.localStorage.removeItem(STORAGE_PREFIX + resourceId)
    } catch {
      // ignore storage errors
    }

    if (next) void likePrompt(resourceId, getSessionId())
    else void unlikePrompt(resourceId)
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={liked}
        aria-label={liked ? 'Unlike' : 'Like'}
        className={cn(
          'inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2',
          liked
            ? 'border-[#FF6B35] bg-[#FFF0E8] text-[#FF6B35]'
            : 'border-[#F0EBE5] bg-white text-[#666666] hover:border-[#FFB26B] hover:text-[#111111]',
          className
        )}
      >
        <Heart size={16} className={liked ? 'fill-[#FF6B35]' : ''} />
        {formatCount(count)}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={cn(
        'inline-flex items-center gap-1 text-xs transition-colors',
        liked ? 'text-[#FF6B35]' : 'text-[#999999] hover:text-[#FF6B35]',
        className
      )}
    >
      <Heart size={11} className={liked ? 'fill-[#FF6B35]' : ''} />
      {formatCount(count)}
    </button>
  )
}

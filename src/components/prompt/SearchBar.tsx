'use client'

/**
 * SearchBar — submits to /search?q=. Client Component so it can manage input
 * state and navigate on submit.
 *
 * Variants:
 *   - default: large pill (used on the /search page)
 *   - compact: header-sized input (always visible in the sticky header)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { routes } from '@/config/routes'

interface SearchBarProps {
  initialQuery?: string
  autoFocus?: boolean
  variant?: 'default' | 'compact'
  className?: string
}

export function SearchBar({
  initialQuery = '',
  autoFocus = false,
  variant = 'default',
  className,
}: SearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) router.push(routes.search(trimmed))
  }

  const compact = variant === 'compact'

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)} role="search">
      <Search
        size={compact ? 15 : 16}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-[#999999]',
          compact ? 'left-3' : 'left-4'
        )}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        placeholder="Search prompts…"
        aria-label="Search prompts"
        className={cn(
          'w-full border border-[#D9CFC7] bg-white text-[#111111]',
          'placeholder:text-[#999999]',
          'shadow-sm',
          'transition-all duration-200',
          'focus:border-[#FF6B35]',
          'focus:outline-none',
          'focus:ring-2 focus:ring-[#FF6B35]/15',
          compact
            ? 'h-9 rounded-lg pl-9 pr-3 text-sm'
            : 'h-12 rounded-full pl-11 pr-4 text-sm'
        )}
      />
    </form>
  )
}

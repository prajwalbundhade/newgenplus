'use client'

/**
 * SearchBar — submits to /search?q=. Client Component so it can manage input
 * state and navigate on submit.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { routes } from '@/config/routes'

interface SearchBarProps {
  initialQuery?: string
  autoFocus?: boolean
}

export function SearchBar({ initialQuery = '', autoFocus = false }: SearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) router.push(routes.search(trimmed))
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999999]" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        placeholder="Search prompts…"
        className="h-12 w-full rounded-full border border-[#F0EBE5] bg-white pl-11 pr-4 text-sm text-[#111111] placeholder:text-[#999999] transition-colors focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
      />
    </form>
  )
}

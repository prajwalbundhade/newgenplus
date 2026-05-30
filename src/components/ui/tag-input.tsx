'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  /** Form field name — a hidden input is rendered with the comma-joined value. */
  name: string
  defaultValue?: string[]
  placeholder?: string
  /** Max number of tags allowed. */
  max?: number
  className?: string
}

/**
 * TagInput — type a tag and press Enter (or comma) to lock it in as a chip.
 * Each chip has an X to remove it. Backspace on an empty input removes the last
 * chip. Tags are normalised (lowercased, trimmed) and de-duplicated.
 *
 * Submits a comma-joined string in a hidden input named `name`, so the existing
 * server action (which splits on commas) needs no changes.
 */
export function TagInput({
  name,
  defaultValue = [],
  placeholder = 'Type a tag and press Enter',
  max = 20,
  className,
}: TagInputProps) {
  const [tags, setTags] = React.useState<string[]>(() => normaliseList(defaultValue))
  const [draft, setDraft] = React.useState('')

  function addTag(raw: string) {
    const value = normalise(raw)
    if (!value) return
    setTags((prev) => {
      if (prev.includes(value) || prev.length >= max) return prev
      return [...prev, value]
    })
    setDraft('')
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      // Quick-remove the last chip.
      e.preventDefault()
      setTags((prev) => prev.slice(0, -1))
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    if (text.includes(',')) {
      e.preventDefault()
      text.split(',').forEach(addTag)
    }
  }

  return (
    <div className={className}>
      {/* Hidden input carries the comma-joined value for the form action. */}
      <input type="hidden" name={name} value={tags.join(', ')} />

      <div
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-[#F0EBE5] bg-white px-2 py-1.5',
          'transition-colors focus-within:border-[#FF6B35] focus-within:ring-2 focus-within:ring-[#FF6B35]/20'
        )}
        onClick={(e) => {
          // Focus the input when clicking anywhere in the box.
          const input = e.currentTarget.querySelector('input[type="text"]') as HTMLInputElement | null
          input?.focus()
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-[#FFF0E8] py-0.5 pl-2 pr-1 text-xs font-medium text-[#FF6B35]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="flex h-4 w-4 items-center justify-center rounded-sm text-[#FF6B35] transition-colors hover:bg-[#FFD9C7] hover:text-[#e55a25]"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => addTag(draft)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none"
        />
      </div>
    </div>
  )
}

function normalise(value: string): string {
  return value.trim().toLowerCase()
}

function normaliseList(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const n = normalise(v)
    if (n && !seen.has(n)) {
      seen.add(n)
      out.push(n)
    }
  }
  return out
}

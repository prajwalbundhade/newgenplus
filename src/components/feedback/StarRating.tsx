'use client'

/**
 * StarRating — interactive 1–5 star rating component.
 *
 * Accessible, keyboard-navigable, with hover preview and smooth transitions.
 */

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="group flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-95"
          >
            <Star
              size={20}
              className={`transition-colors duration-150 ${
                active
                  ? 'fill-[#FF6B35] text-[#FF6B35]'
                  : 'fill-transparent text-[#D9CFC7] group-hover:text-[#FF8A4C]'
              }`}
            />
          </button>
        )
      })}
      {value > 0 && (
        <span className="ml-2 text-xs text-[#999999]">
          {value}/5
        </span>
      )}
    </div>
  )
}

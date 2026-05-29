import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

/**
 * Native select styled to match the design system. Native is intentional —
 * accessible, zero JS, and mobile-friendly without extra dependencies.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full appearance-none rounded-lg border border-[#F0EBE5] bg-white px-3 pr-9',
          'text-sm text-[#111111]',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999999]"
      />
    </div>
  )
)
Select.displayName = 'Select'

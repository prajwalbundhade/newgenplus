import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-lg border border-[#F0EBE5] bg-white px-3 py-2',
        'text-sm text-[#111111] placeholder:text-[#999999]',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-0 focus:border-[#FF6B35]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

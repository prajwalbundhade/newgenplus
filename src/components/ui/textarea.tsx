import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full rounded-lg border border-[#F0EBE5] bg-white px-3 py-2',
        'text-sm text-[#111111] placeholder:text-[#999999]',
        'transition-colors duration-150 resize-y',
        'focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

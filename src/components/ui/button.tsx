import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg',
    'text-sm font-medium transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-[#FF6B35] text-white shadow-sm hover:bg-[#FF8A4C] active:bg-[#e55a25]',
        secondary:
          'bg-[#FFF0E8] text-[#FF6B35] hover:bg-[#FFE4D4] active:bg-[#ffd4bc]',
        outline:
          'border border-[#F0EBE5] bg-white text-[#111111] hover:bg-[#FFF9F5] hover:border-[#E5DDD6]',
        ghost:
          'text-[#666666] hover:bg-[#FFF9F5] hover:text-[#111111]',
        danger:
          'bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]',
        link:
          'text-[#FF6B35] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm:   'h-8  px-3   text-xs',
        md:   'h-9  px-4   text-sm',
        lg:   'h-10 px-5   text-sm',
        xl:   'h-11 px-6   text-base',
        icon: 'h-9  w-9    p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { buttonVariants }

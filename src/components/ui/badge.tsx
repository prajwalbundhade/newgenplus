import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-[#FFF0E8] text-[#FF6B35]',
        secondary: 'bg-[#F5F5F5] text-[#666666]',
        success:   'bg-[#F0FDF4] text-[#16A34A]',
        warning:   'bg-[#FFFBEB] text-[#D97706]',
        danger:    'bg-[#FEF2F2] text-[#DC2626]',
        info:      'bg-[#EFF6FF] text-[#2563EB]',
        outline:   'border border-[#F0EBE5] text-[#666666] bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

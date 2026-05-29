/**
 * EmptyState — shown when a table or list has no data.
 * Server Component.
 */

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0E8]">
        <Icon size={24} className="text-[#FF6B35]" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[#111111]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-[#666666]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

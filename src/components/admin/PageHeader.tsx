/**
 * PageHeader — consistent top section for every admin page.
 *
 * Server Component.
 */

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Slot for action buttons (e.g. "New Prompt") */
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-8 py-6', className)}>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#111111]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[#666666]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

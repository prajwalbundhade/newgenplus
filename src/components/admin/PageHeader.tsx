/**
 * PageHeader — consistent top section for every admin page.
 *
 * Server Component. Responsive: comfortable desktop padding, tighter on mobile,
 * with title and actions stacking on small screens.
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
    <div
      className={cn(
        'flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-8 sm:py-6',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-[#111111] sm:text-xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[#666666]">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

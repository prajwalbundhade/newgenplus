/**
 * StatCard — dashboard metric card.
 *
 * Server Component. Displays a single KPI with icon, value, label, and
 * an optional trend indicator.
 */

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCount } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  /** Colour theme for the icon background */
  iconColor?: 'orange' | 'blue' | 'green' | 'yellow' | 'purple'
  /** Optional trend: positive = up, negative = down, zero = flat */
  trend?: number
  trendLabel?: string
  className?: string
}

const iconColorMap: Record<NonNullable<StatCardProps['iconColor']>, string> = {
  orange: 'bg-[#FFF0E8] text-[#FF6B35]',
  blue:   'bg-[#EFF6FF] text-[#2563EB]',
  green:  'bg-[#F0FDF4] text-[#16A34A]',
  yellow: 'bg-[#FFFBEB] text-[#D97706]',
  purple: 'bg-[#F5F3FF] text-[#7C3AED]',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'orange',
  trend,
  trendLabel,
  className,
}: StatCardProps) {
  const hasTrend = trend !== undefined

  return (
    <div
      className={cn(
        'rounded-xl border border-[#F0EBE5] bg-white p-5',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]',
        'transition-shadow duration-200 hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06)]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#999999]">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#111111]">
            {formatCount(value)}
          </p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconColorMap[iconColor])}>
          <Icon size={18} />
        </div>
      </div>

      {hasTrend && (
        <div className="mt-4 flex items-center gap-1.5">
          {trend > 0 ? (
            <TrendingUp size={13} className="text-[#16A34A]" />
          ) : trend < 0 ? (
            <TrendingDown size={13} className="text-[#DC2626]" />
          ) : (
            <Minus size={13} className="text-[#999999]" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              trend > 0 ? 'text-[#16A34A]' : trend < 0 ? 'text-[#DC2626]' : 'text-[#999999]'
            )}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-xs text-[#999999]">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}

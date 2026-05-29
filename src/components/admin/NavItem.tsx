'use client'

/**
 * NavItem — Client Component.
 *
 * Reads the current pathname to apply the active state.
 * Isolated here so AdminShell stays a Server Component.
 *
 * Icons are resolved from a string key (NavIconKey) rather than receiving the
 * lucide component as a prop. React 19 / Next.js 16 forbids passing functions
 * (component references) from a Server Component to a Client Component, so the
 * server passes a serialisable string and the lookup happens here on the client.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Sparkles,
  Tag,
  Cpu,
  Star,
  Settings,
  type LucideIcon,
} from 'lucide-react'

// Serialisable icon keys — safe to pass across the server/client boundary.
export type NavIconKey =
  | 'dashboard'
  | 'prompts'
  | 'categories'
  | 'models'
  | 'reviews'
  | 'settings'

const ICONS: Record<NavIconKey, LucideIcon> = {
  dashboard:  LayoutDashboard,
  prompts:    Sparkles,
  categories: Tag,
  models:     Cpu,
  reviews:    Star,
  settings:   Settings,
}

interface NavItemProps {
  href: string
  label: string
  icon: NavIconKey
  /** If true, only exact match triggers active state (used for /admin root) */
  exact?: boolean
}

export function NavItem({ href, label, icon, exact = false }: NavItemProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  const Icon = ICONS[icon]

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-[#FFF0E8] text-[#FF6B35]'
          : 'text-[#666666] hover:bg-[#FFF9F5] hover:text-[#111111]'
      )}
    >
      <Icon
        size={16}
        className={cn(
          'shrink-0 transition-colors',
          isActive ? 'text-[#FF6B35]' : 'text-[#999999] group-hover:text-[#666666]'
        )}
      />
      <span>{label}</span>
      {isActive && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FF6B35]" aria-hidden />
      )}
    </Link>
  )
}

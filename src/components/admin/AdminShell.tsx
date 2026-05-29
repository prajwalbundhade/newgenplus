/**
 * AdminShell — authenticated admin layout wrapper.
 *
 * Server Component. Receives a verified AdminSession from the layout.
 * Interactive elements (NavItem active state, LogoutButton) are isolated
 * in their own Client Components.
 */

import type { AdminSession } from '@/lib/dal'
import { Sparkles } from 'lucide-react'
import { NavItem, type NavIconKey } from './NavItem'
import { LogoutButton } from './LogoutButton'
import { Badge } from '@/components/ui/badge'

interface AdminShellProps {
  session: AdminSession
  children: React.ReactNode
}

const NAV_ITEMS: { href: string; label: string; icon: NavIconKey; exact: boolean }[] = [
  { href: '/admin',            label: 'Dashboard',  icon: 'dashboard',  exact: true },
  { href: '/admin/prompts',    label: 'Prompts',    icon: 'prompts',    exact: false },
  { href: '/admin/categories', label: 'Categories', icon: 'categories', exact: false },
  { href: '/admin/models',     label: 'Models',     icon: 'models',     exact: false },
  { href: '/admin/reviews',    label: 'Reviews',    icon: 'reviews',    exact: false },
]

export function AdminShell({ session, children }: AdminShellProps) {
  const initials = session.email.slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFF9F5]">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-[#F0EBE5] bg-white">

        {/* Brand mark */}
        <div className="flex h-14 items-center gap-2.5 border-b border-[#F0EBE5] px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B35]">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold tracking-tight text-[#111111]">NewGenPlus</span>
            <span className="rounded-full bg-[#FFF0E8] px-1.5 py-0.5 text-[10px] font-semibold text-[#FF6B35] leading-none">
              Admin
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                exact={item.exact}
              />
            ))}
          </div>

          <div className="mt-6 border-t border-[#F0EBE5] pt-4">
            <NavItem
              href="/admin/settings"
              label="Settings"
              icon="settings"
              exact={false}
            />
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-[#F0EBE5] p-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FFB26B] text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#111111]" title={session.email}>
                {session.email}
              </p>
              <Badge variant="default" className="mt-0.5 text-[10px] px-1.5 py-0">
                {session.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
          </div>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

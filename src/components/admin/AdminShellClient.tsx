'use client'

/**
 * AdminShellClient — responsive admin chrome.
 *
 * Desktop (lg+): fixed left sidebar, exactly as before.
 * Mobile/tablet: a sticky top bar with a hamburger that opens a slide-in
 * drawer holding the same navigation. The drawer closes on navigation and
 * locks body scroll while open.
 *
 * Receives a serialisable session (email + role) from the server AdminShell.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { NavItem, type NavIconKey } from './NavItem'
import { LogoutButton } from './LogoutButton'
import { Badge } from '@/components/ui/badge'
import type { AdminRole } from '@/types/database.types'

interface AdminShellClientProps {
  email: string
  role: AdminRole
  children: React.ReactNode
}

const NAV_ITEMS: { href: string; label: string; icon: NavIconKey; exact: boolean }[] = [
  { href: '/admin',            label: 'Dashboard',  icon: 'dashboard',  exact: true },
  { href: '/admin/prompts',    label: 'Prompts',    icon: 'prompts',    exact: false },
  { href: '/admin/categories', label: 'Categories', icon: 'categories', exact: false },
  { href: '/admin/models',     label: 'Models',     icon: 'models',     exact: false },
  { href: '/admin/reviews',    label: 'Reviews',    icon: 'reviews',    exact: false },
]

export function AdminShellClient({ email, role, children }: AdminShellClientProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFF9F5]">

      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[#F0EBE5] bg-white lg:flex">
        <SidebarContent email={email} role={role} />
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden
      />
      {/* Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-72 flex-col border-r border-[#F0EBE5] bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
      >
        <SidebarContent
          email={email}
          role={role}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>

      {/* ── Main column ──────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#F0EBE5] bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#666666] transition-colors hover:bg-[#FFF9F5] hover:text-[#111111]"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B35]">
              <BrandIcon size={17} />
            </span>
            <span className="text-sm font-bold tracking-tight text-[#111111]">NeuwGenX</span>
            <span className="rounded-full bg-[#FFF0E8] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#FF6B35]">
              Admin
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Shared sidebar content (desktop aside + mobile drawer)
───────────────────────────────────────────────────────────────────────── */

function SidebarContent({
  email,
  role,
  onClose,
}: {
  email: string
  role: AdminRole
  onClose?: () => void
}) {
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <>
      {/* Brand */}
      <div className="flex h-14 items-center justify-between gap-2.5 border-b border-[#F0EBE5] px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B35]">
            <BrandIcon size={17} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold tracking-tight text-[#111111]">NeuwGenX</span>
            <span className="rounded-full bg-[#FFF0E8] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#FF6B35]">
              Admin
            </span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#666666] transition-colors hover:bg-[#FFF9F5] hover:text-[#111111] lg:hidden"
          >
            <X size={18} />
          </button>
        )}
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
          <NavItem href="/admin/settings" label="Settings" icon="settings" exact={false} />
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-[#F0EBE5] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FFB26B] text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[#111111]" title={email}>
              {email}
            </p>
            <Badge variant="default" className="mt-0.5 px-1.5 py-0 text-[10px]">
              {role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
        </div>
        <div className="mt-3">
          <LogoutButton />
        </div>
      </div>
    </>
  )
}

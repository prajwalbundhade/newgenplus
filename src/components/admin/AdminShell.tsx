/**
 * AdminShell — the authenticated admin layout wrapper.
 *
 * Receives a verified AdminSession from the layout (never fetches auth itself).
 * Renders the sidebar navigation and the main content area.
 *
 * This is a Server Component — no 'use client' directive.
 * Interactive elements (logout button) are isolated in their own Client Component.
 */

import Link from 'next/link'
import type { AdminSession } from '@/lib/dal'
import { LogoutButton } from './LogoutButton'

interface AdminShellProps {
  session: AdminSession
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/prompts', label: 'Prompts' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/models', label: 'Models' },
  { href: '/admin/reviews', label: 'Reviews' },
] as const

export function AdminShell({ session, children }: AdminShellProps) {
  return (
    <div className="min-h-screen flex bg-[#FFF9F5]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col bg-white border-r border-gray-100">
        {/* Brand */}
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#FF6B35]">
            NewGenPlus
          </span>
          <span className="ml-1.5 text-xs text-gray-400">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-[#FFF9F5] hover:text-[#FF6B35] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer — session info + logout */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-400 truncate" title={session.email}>
            {session.email}
          </p>
          <p className="text-xs text-gray-300">{session.role}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

'use client'

/**
 * LogoutButton — Client Component.
 *
 * Calls the logout Server Function via useTransition.
 * Using a form action ensures it works without JavaScript
 * and avoids CSRF issues (POST-only Server Functions).
 */

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { logout } from '@/features/admin/actions/auth.actions'
import { cn } from '@/lib/utils'

export function LogoutButton() {
  const [pending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <form action={handleLogout}>
      <button
        type="submit"
        disabled={pending}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
          'text-[#999999] transition-colors duration-150',
          'hover:bg-[#FEF2F2] hover:text-[#DC2626]',
          'disabled:pointer-events-none disabled:opacity-50'
        )}
      >
        <LogOut size={13} className="shrink-0" />
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </form>
  )
}

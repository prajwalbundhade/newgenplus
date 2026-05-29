'use client'

/**
 * LogoutButton — Client Component.
 *
 * Calls the logout Server Function via a form action.
 * Using a form (not onClick + fetch) ensures it works without JavaScript
 * and avoids CSRF issues (POST-only Server Functions).
 */

import { useTransition } from 'react'
import { logout } from '@/features/admin/actions/auth.actions'

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
        className="w-full text-left text-xs text-gray-400 hover:text-[#FF6B35] transition-colors disabled:opacity-50"
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </form>
  )
}

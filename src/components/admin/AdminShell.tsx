/**
 * AdminShell — authenticated admin layout wrapper.
 *
 * Server Component. Receives a verified AdminSession from the layout and hands
 * the serialisable fields (email, role) to the responsive client shell, which
 * renders the desktop sidebar and the mobile drawer + top bar.
 */

import type { AdminSession } from '@/lib/dal'
import { AdminShellClient } from './AdminShellClient'

interface AdminShellProps {
  session: AdminSession
  children: React.ReactNode
}

export function AdminShell({ session, children }: AdminShellProps) {
  return (
    <AdminShellClient email={session.email} role={session.role}>
      {children}
    </AdminShellClient>
  )
}

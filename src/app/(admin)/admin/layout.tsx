/**
 * Admin layout — server-side authorization gate.
 *
 * This layout wraps ALL /admin/* routes (except /admin/login and the
 * auth callback, which are outside this layout via route grouping).
 *
 * It performs the definitive authorization check:
 *   1. Calls getAdminSession() from the DAL (cached per request)
 *   2. Redirects to /admin/login if no valid admin session exists
 *
 * The proxy (proxy.ts) is a fast-path guard that handles unauthenticated
 * requests before they reach the server. This layout is the authoritative
 * second layer that also enforces the admin_users allowlist.
 */

import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/dal'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = {
  robots: 'noindex, nofollow',
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <AdminShell session={session}>
      {children}
    </AdminShell>
  )
}

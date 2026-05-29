/**
 * Protected admin layout — server-side authorization gate.
 *
 * Lives in the (protected) route group so it ONLY wraps the authenticated
 * admin pages (/admin, /admin/prompts, /admin/categories, /admin/models,
 * /admin/reviews, /admin/settings).
 *
 * The login route (/admin/login) is a SIBLING of this route group, not a
 * child, so it is intentionally NOT wrapped by this gate — preventing the
 * redirect loop that occurs when the gate sits at the /admin level.
 *
 * Route groups `(protected)` do not add a URL segment, so all public URLs
 * remain unchanged (e.g. this still serves /admin, not /admin/protected).
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

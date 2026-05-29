/**
 * Admin dashboard — /admin
 *
 * Authorization is enforced by the parent AdminLayout.
 * This page can safely assume a valid admin session exists.
 */

import { getAdminSession } from '@/lib/dal'

export const metadata = {
  title: 'Dashboard — NewGenPlus Admin',
}

export default async function AdminDashboardPage() {
  // getAdminSession() is cached — no extra DB call (layout already called it)
  const session = await getAdminSession()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#111111]">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-500">
        Signed in as <span className="font-medium">{session?.email}</span>
        {' '}({session?.role})
      </p>
      {/* Content management UI will be built in subsequent phases */}
    </div>
  )
}

/**
 * Admin settings — /admin/settings
 * Authorization enforced by AdminLayout.
 */

import { Settings } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings — NeuwGenX Admin',
  robots: 'noindex, nofollow',
}

export default function AdminSettingsPage() {
  return (
    <div className="min-h-full">
      <PageHeader
        title="Settings"
        description="Platform configuration and preferences."
      />
      <Separator />
      <div className="px-4 py-5 sm:px-8 sm:py-6">
        <EmptyState
          icon={Settings}
          title="Settings coming soon"
          description="Platform settings will be available in a future update."
        />
      </div>
    </div>
  )
}

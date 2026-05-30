/**
 * Admin dashboard — /admin
 *
 * Authorization is enforced by the parent AdminLayout.
 * This page can safely assume a valid admin session exists.
 *
 * Stats are fetched server-side using the admin Supabase client.
 * getAdminSession() is cached — no extra DB call (layout already called it).
 */

import { Sparkles, Eye, Copy, Star, TrendingUp, Clock, CheckCircle, Heart } from 'lucide-react'
import { getAdminSession } from '@/lib/dal'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatCard } from '@/components/admin/StatCard'
import { PageHeader } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'
import type { ResourceRow, ReviewRow } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Dashboard — NewGenPlus Admin',
  robots: 'noindex, nofollow',
}

// ─── Data fetching ────────────────────────────────────────────────────────────

interface DashboardStats {
  totalResources: number
  publishedResources: number
  totalViews: number
  totalCopies: number
  totalLikes: number
  pendingReviews: number
  approvedReviews: number
}

async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = createAdminClient()

    const [resourcesResult, , reviewsResult] = await Promise.all([
      supabase
        .from('resources')
        .select('status, view_count, copy_count, like_count'),
      supabase
        .from('resources')
        .select('view_count, copy_count'),
      supabase
        .from('reviews')
        .select('status'),
    ])

    const resources = (resourcesResult.data as Pick<ResourceRow, 'status' | 'view_count' | 'copy_count' | 'like_count'>[] | null) ?? []
    const reviews = (reviewsResult.data as Pick<ReviewRow, 'status'>[] | null) ?? []

    const totalResources = resources.length
    const publishedResources = resources.filter((r) => r.status === 'published').length
    const totalViews = resources.reduce((sum, r) => sum + (r.view_count ?? 0), 0)
    const totalCopies = resources.reduce((sum, r) => sum + (r.copy_count ?? 0), 0)
    const totalLikes = resources.reduce((sum, r) => sum + (r.like_count ?? 0), 0)
    const pendingReviews = reviews.filter((r) => r.status === 'pending').length
    const approvedReviews = reviews.filter((r) => r.status === 'approved').length

    return { totalResources, publishedResources, totalViews, totalCopies, totalLikes, pendingReviews, approvedReviews }
  } catch {
    return {
      totalResources: 0,
      publishedResources: 0,
      totalViews: 0,
      totalCopies: 0,
      totalLikes: 0,
      pendingReviews: 0,
      approvedReviews: 0,
    }
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const [session, stats] = await Promise.all([
    getAdminSession(),
    getDashboardStats(),
  ])

  const greeting = getGreeting()

  return (
    <div className="min-h-full">
      <PageHeader
        title={`${greeting}, ${session?.email?.split('@')[0] ?? 'Admin'}`}
        description="Here's what's happening with NewGenPlus today."
      />

      <Separator />

      <div className="px-8 py-6 space-y-8">

        {/* ── KPI cards ── */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#999999]">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Total Resources"
              value={stats.totalResources}
              icon={Sparkles}
              iconColor="orange"
            />
            <StatCard
              label="Total Views"
              value={stats.totalViews}
              icon={Eye}
              iconColor="blue"
            />
            <StatCard
              label="Total Copies"
              value={stats.totalCopies}
              icon={Copy}
              iconColor="green"
            />
            <StatCard
              label="Total Likes"
              value={stats.totalLikes}
              icon={Heart}
              iconColor="pink"
            />
            <StatCard
              label="Pending Reviews"
              value={stats.pendingReviews}
              icon={Star}
              iconColor="yellow"
            />
          </div>
        </section>

        {/* ── Secondary stats ── */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#999999]">
            Content Health
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ContentHealthCard
              icon={CheckCircle}
              label="Published"
              value={stats.publishedResources}
              total={stats.totalResources}
              color="green"
            />
            <ContentHealthCard
              icon={Clock}
              label="Pending Reviews"
              value={stats.pendingReviews}
              total={stats.pendingReviews + stats.approvedReviews}
              color="yellow"
            />
            <ContentHealthCard
              icon={TrendingUp}
              label="Approved Reviews"
              value={stats.approvedReviews}
              total={stats.pendingReviews + stats.approvedReviews}
              color="blue"
            />
          </div>
        </section>

        {/* ── Quick actions ── */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#999999]">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickActionCard href="/admin/prompts" label="Manage Prompts" icon={Sparkles} />
            <QuickActionCard href="/admin/categories" label="Categories" icon={Star} />
            <QuickActionCard href="/admin/models" label="AI Models" icon={TrendingUp} />
            <QuickActionCard href="/admin/reviews" label="Review Queue" icon={Clock} badge={stats.pendingReviews > 0 ? stats.pendingReviews : undefined} />
          </div>
        </section>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface ContentHealthCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  total: number
  color: 'green' | 'yellow' | 'blue'
}

const healthColorMap = {
  green:  { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]', bar: 'bg-[#16A34A]' },
  yellow: { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', bar: 'bg-[#D97706]' },
  blue:   { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', bar: 'bg-[#2563EB]' },
}

function ContentHealthCard({ icon: Icon, label, value, total, color }: ContentHealthCardProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const colors = healthColorMap[color]

  return (
    <div className="rounded-xl border border-[#F0EBE5] bg-white p-5">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}>
          <Icon size={15} className={colors.text} />
        </div>
        <span className="text-sm font-medium text-[#111111]">{label}</span>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-[#111111]">{value}</span>
          <span className="text-xs text-[#999999]">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F0EBE5]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  )
}

interface QuickActionCardProps {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number
}

function QuickActionCard({ href, label, icon: Icon, badge }: QuickActionCardProps) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-[#F0EBE5] bg-white p-4 transition-all duration-150 hover:border-[#FFB26B] hover:shadow-[0_4px_12px_0_rgb(255_107_53/0.08)]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF0E8] transition-colors group-hover:bg-[#FF6B35]">
        <Icon size={16} className="text-[#FF6B35] transition-colors group-hover:text-white" />
      </div>
      <span className="flex-1 text-sm font-medium text-[#111111]">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="warning" className="shrink-0">{badge}</Badge>
      )}
    </a>
  )
}

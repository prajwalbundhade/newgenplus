/**
 * Admin review moderation — /admin/reviews
 * Authorization enforced by AdminLayout.
 */

import { Star, CheckCircle, XCircle, Clock } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/admin/PageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'
import type { ReviewRow } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Reviews — NewGenPlus Admin',
  robots: 'noindex, nofollow',
}

// ─── Data fetching ────────────────────────────────────────────────────────────

interface ReviewWithResource extends ReviewRow {
  resource_title?: string
}

async function getReviews(): Promise<ReviewWithResource[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    return (data as ReviewRow[] | null) ?? []
  } catch {
    return []
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminReviewsPage() {
  const reviews = await getReviews()

  const pending  = reviews.filter((r) => r.status === 'pending')
  const approved = reviews.filter((r) => r.status === 'approved')
  const rejected = reviews.filter((r) => r.status === 'rejected')

  return (
    <div className="min-h-full">
      <PageHeader
        title="Reviews"
        description="Moderate user-submitted reviews before they go public."
      />

      <Separator />

      <div className="px-8 py-6 space-y-6">

        {/* ── Status tabs summary ── */}
        <div className="grid grid-cols-3 gap-4">
          <ReviewSummaryCard
            icon={Clock}
            label="Pending"
            count={pending.length}
            color="yellow"
          />
          <ReviewSummaryCard
            icon={CheckCircle}
            label="Approved"
            count={approved.length}
            color="green"
          />
          <ReviewSummaryCard
            icon={XCircle}
            label="Rejected"
            count={rejected.length}
            color="red"
          />
        </div>

        {/* ── Pending queue (priority) ── */}
        {pending.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#111111]">
              <Clock size={14} className="text-[#D97706]" />
              Pending Approval
              <Badge variant="warning">{pending.length}</Badge>
            </h2>
            <div className="space-y-3">
              {pending.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </section>
        )}

        {/* ── All reviews ── */}
        {reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Reviews submitted by users will appear here for moderation."
          />
        ) : (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-[#111111]">All Reviews</h2>
            <div className="rounded-xl border border-[#F0EBE5] bg-white overflow-hidden divide-y divide-[#F0EBE5]">
              {reviews.map((review) => (
                <ReviewListRow key={review.id} review={review} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ReviewSummaryCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  count: number
  color: 'yellow' | 'green' | 'red'
}

const summaryColorMap = {
  yellow: { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', num: 'text-[#D97706]' },
  green:  { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]', num: 'text-[#16A34A]' },
  red:    { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', num: 'text-[#DC2626]' },
}

function ReviewSummaryCard({ icon: Icon, label, count, color }: ReviewSummaryCardProps) {
  const colors = summaryColorMap[color]
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#F0EBE5] bg-white p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}>
        <Icon size={18} className={colors.text} />
      </div>
      <div>
        <p className="text-xs font-medium text-[#999999]">{label}</p>
        <p className={`text-2xl font-bold ${colors.num}`}>{count}</p>
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewRow }) {
  return (
    <div className="rounded-xl border border-[#F0EBE5] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-[#111111]">{review.reviewer_name}</span>
            {review.rating !== null && (
              <StarRating rating={review.rating} />
            )}
            <span className="text-xs text-[#999999]">
              {new Date(review.created_at).toLocaleDateString('en', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#666666] leading-relaxed">{review.body}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm">
            <CheckCircle size={13} />
            Approve
          </Button>
          <Button variant="danger" size="sm">
            <XCircle size={13} />
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}

function ReviewListRow({ review }: { review: ReviewRow }) {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#111111]">{review.reviewer_name}</span>
          {review.rating !== null && <StarRating rating={review.rating} />}
          <ReviewStatusBadge status={review.status} />
          <span className="text-xs text-[#999999]">
            {new Date(review.created_at).toLocaleDateString('en', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
        <p className="mt-1 text-sm text-[#666666] line-clamp-2">{review.body}</p>
      </div>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < rating ? 'fill-[#FFB26B] text-[#FFB26B]' : 'text-[#E5DDD6]'}
        />
      ))}
    </div>
  )
}

function ReviewStatusBadge({ status }: { status: ReviewRow['status'] }) {
  const map: Record<ReviewRow['status'], { label: string; variant: 'warning' | 'success' | 'danger' }> = {
    pending:  { label: 'Pending',  variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'warning' }
  return <Badge variant={variant}>{label}</Badge>
}

// app/admin/prompts/page.tsx

import Link from 'next/link'
import Image from 'next/image'
import { Plus, Sparkles, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { publicStorageUrl } from '@/lib/supabase/storage'
import { routes } from '@/config/routes'
import { PageHeader } from '@/components/admin/PageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { PromptRowActions } from '@/components/admin/PromptRowActions'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Metadata } from 'next'
import type { ResourceRow } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Prompts — NeuwGenX Admin',
  robots: 'noindex, nofollow',
}

const PAGE_SIZE = 25

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaThumb = { storage_bucket: string; storage_path: string }

interface PromptListItem extends ResourceRow {
  resource_media: MediaThumb | MediaThumb[] | null
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getResources(page: number): Promise<{
  data: PromptListItem[]
  total: number
}> {
  const supabase = createAdminClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('resources')
    .select('*, resource_media(storage_bucket, storage_path)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as PromptListItem[],
    total: count ?? 0,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminPromptsPage({ searchParams }: PageProps) {
  const { page } = await searchParams
  const currentPage = Math.max(1, Number(page ?? 1))
  const { data: resources, total } = await getResources(currentPage)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-full">
      <PageHeader
        title="Prompts"
        description="Manage all AI prompts and resources."
        actions={
          <Link
            href={routes.admin.prompts + '/new'}
            className={buttonVariants({ variant: 'primary', size: 'md' })}
          >
            <Plus size={15} />
            New Prompt
          </Link>
        }
      />

      <Separator />

      <div className="px-4 py-5 sm:px-8 sm:py-6">
        {resources.length === 0 && currentPage === 1 ? (
          <EmptyState
            icon={Sparkles}
            title="No prompts yet"
            description="Create your first AI prompt to get started."
            action={
              <Link
                href={routes.admin.prompts + '/new'}
                className={buttonVariants({ variant: 'primary', size: 'md' })}
              >
                <Plus size={15} />
                New Prompt
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#F0EBE5] bg-white">
            {/* Table header row */}
            <div className="flex items-center justify-between border-b border-[#F0EBE5] px-5 py-3">
              <span className="text-xs font-medium text-[#999999]">
                {total} {total === 1 ? 'prompt' : 'prompts'}
              </span>
              <span className="text-xs text-[#BBBBBB]">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Views</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Copies</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Likes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <PromptTableRow key={resource.id} resource={resource} />
                ))}
              </TableBody>
            </Table>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={routes.admin.prompts}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number
  totalPages: number
  basePath: string
}) {
  const prevPage = currentPage - 1
  const nextPage = currentPage + 1
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  // Build visible page numbers — always show first, last, current ± 1
  const pages = buildPageRange(currentPage, totalPages)

  return (
    <div className="flex items-center justify-between border-t border-[#F0EBE5] px-5 py-3">
      {/* Prev */}
      {hasPrev ? (
        <Link
          href={`${basePath}?page=${prevPage}`}
          className="flex items-center gap-1 text-xs font-medium text-[#666666] hover:text-[#111111] transition-colors"
        >
          <ChevronLeft size={14} />
          Previous
        </Link>
      ) : (
        <span className="flex items-center gap-1 text-xs font-medium text-[#CCCCCC] cursor-not-allowed">
          <ChevronLeft size={14} />
          Previous
        </span>
      )}

      {/* Page numbers */}
      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-xs text-[#CCCCCC]">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={`${basePath}?page=${p}`}
              className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${p === currentPage
                ? 'bg-[#111111] text-white'
                : 'text-[#666666] hover:bg-[#F5F0EB] hover:text-[#111111]'
                }`}
            >
              {p}
            </Link>
          )
        )}
      </div>

      {/* Next */}
      {hasNext ? (
        <Link
          href={`${basePath}?page=${nextPage}`}
          className="flex items-center gap-1 text-xs font-medium text-[#666666] hover:text-[#111111] transition-colors"
        >
          Next
          <ChevronRight size={14} />
        </Link>
      ) : (
        <span className="flex items-center gap-1 text-xs font-medium text-[#CCCCCC] cursor-not-allowed">
          Next
          <ChevronRight size={14} />
        </span>
      )}
    </div>
  )
}

// Produces e.g. [1, 2, 3, '...', 12] or [1, '...', 5, 6, 7, '...', 12]
function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = []
  const addPage = (p: number) => {
    if (!pages.includes(p)) pages.push(p)
  }

  addPage(1)
  if (current > 3) pages.push('...')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    addPage(p)
  }
  if (current < total - 2) pages.push('...')
  addPage(total)

  return pages
}

// ─── Row (unchanged) ──────────────────────────────────────────────────────────

function PromptTableRow({ resource }: { resource: PromptListItem }) {
  const media = Array.isArray(resource.resource_media)
    ? resource.resource_media[0]
    : resource.resource_media
  const thumbUrl = media
    ? publicStorageUrl(media.storage_bucket, media.storage_path)
    : null

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#F0EBE5] bg-[#FFF9F5]">
            {thumbUrl ? (
              <Image src={thumbUrl} alt="" fill className="object-cover" sizes="44px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Sparkles size={14} className="text-[#E5DDD6]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="line-clamp-1 font-medium text-[#111111]">{resource.title}</p>
              {resource.is_featured && (
                <Star size={12} className="shrink-0 fill-[#FF6B35] text-[#FF6B35]" />
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-[#999999]">/{resource.slug}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
              <StatusBadge status={resource.status} />
              <span className="text-[11px] text-[#999999]">
                {resource.view_count.toLocaleString()} views ·{' '}
                {resource.copy_count.toLocaleString()} copies ·{' '}
                {(resource.like_count ?? 0).toLocaleString()} likes
              </span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <ResourceTypeBadge type={resource.resource_type} />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <StatusBadge status={resource.status} />
      </TableCell>
      <TableCell className="hidden text-right tabular-nums text-[#666666] lg:table-cell">
        {resource.view_count.toLocaleString()}
      </TableCell>
      <TableCell className="hidden text-right tabular-nums text-[#666666] lg:table-cell">
        {resource.copy_count.toLocaleString()}
      </TableCell>
      <TableCell className="hidden text-right tabular-nums text-[#666666] lg:table-cell">
        {(resource.like_count ?? 0).toLocaleString()}
      </TableCell>
      <TableCell>
        <PromptRowActions
          id={resource.id}
          title={resource.title}
          status={resource.status}
          isFeatured={resource.is_featured}
        />
      </TableCell>
    </TableRow>
  )
}

function ResourceTypeBadge({ type }: { type: ResourceRow['resource_type'] }) {
  const map: Record<ResourceRow['resource_type'], { label: string; variant: 'default' | 'info' | 'secondary' | 'warning' }> = {
    image: { label: 'Image', variant: 'default' },
    video: { label: 'Video', variant: 'info' },
    'website-kit': { label: 'Website Kit', variant: 'warning' },
    workflow: { label: 'Workflow', variant: 'secondary' },
  }
  const { label, variant } = map[type] ?? { label: type, variant: 'secondary' }
  return <Badge variant={variant}>{label}</Badge>
}

function StatusBadge({ status }: { status: ResourceRow['status'] }) {
  const map: Record<ResourceRow['status'], { label: string; variant: 'success' | 'secondary' | 'danger' }> = {
    published: { label: 'Published', variant: 'success' },
    draft: { label: 'Draft', variant: 'secondary' },
    archived: { label: 'Archived', variant: 'danger' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'secondary' }
  return <Badge variant={variant}>{label}</Badge>
}
/**
 * Admin prompts management — /admin/prompts
 * Authorization enforced by the (protected) AdminLayout.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Plus, Sparkles, Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { selectMany } from '@/lib/supabase/query'
import { publicStorageUrl } from '@/lib/supabase/storage'
import { routes } from '@/config/routes'
import { PageHeader } from '@/components/admin/PageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { PromptRowActions } from '@/components/admin/PromptRowActions'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Metadata } from 'next'
import type { ResourceRow } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Prompts — NewGenPlus Admin',
  robots: 'noindex, nofollow',
}

// ─── Data fetching ────────────────────────────────────────────────────────────

type MediaThumb = { storage_bucket: string; storage_path: string }

interface PromptListItem extends ResourceRow {
  resource_media: MediaThumb | MediaThumb[] | null
}

async function getResources(): Promise<PromptListItem[]> {
  const supabase = createAdminClient()
  return selectMany<PromptListItem>(
    supabase
      .from('resources')
      .select('*, resource_media(storage_bucket, storage_path)')
      .order('created_at', { ascending: false })
      .limit(100)
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPromptsPage() {
  const resources = await getResources()

  return (
    <div className="min-h-full">
      <PageHeader
        title="Prompts"
        description="Manage all AI prompts and resources."
        actions={
          <Link href={routes.admin.prompts + '/new'} className={buttonVariants({ variant: 'primary', size: 'md' })}>
            <Plus size={15} />
            New Prompt
          </Link>
        }
      />

      <Separator />

      <div className="px-4 py-5 sm:px-8 sm:py-6">
        {resources.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No prompts yet"
            description="Create your first AI prompt to get started."
            action={
              <Link href={routes.admin.prompts + '/new'} className={buttonVariants({ variant: 'primary', size: 'md' })}>
                <Plus size={15} />
                New Prompt
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#F0EBE5] bg-white">
            <div className="flex items-center justify-between border-b border-[#F0EBE5] px-5 py-3">
              <span className="text-xs font-medium text-[#999999]">
                {resources.length} {resources.length === 1 ? 'prompt' : 'prompts'}
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
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function PromptTableRow({ resource }: { resource: PromptListItem }) {
  const media = Array.isArray(resource.resource_media)
    ? resource.resource_media[0]
    : resource.resource_media
  const thumbUrl = media ? publicStorageUrl(media.storage_bucket, media.storage_path) : null

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
            {/* Mobile-only inline meta (columns hidden on small screens) */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
              <StatusBadge status={resource.status} />
              <span className="text-[11px] text-[#999999]">
                {resource.view_count.toLocaleString()} views · {resource.copy_count.toLocaleString()} copies · {(resource.like_count ?? 0).toLocaleString()} likes
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
    image:         { label: 'Image',       variant: 'default' },
    video:         { label: 'Video',       variant: 'info' },
    'website-kit': { label: 'Website Kit', variant: 'warning' },
    workflow:      { label: 'Workflow',    variant: 'secondary' },
  }
  const { label, variant } = map[type] ?? { label: type, variant: 'secondary' }
  return <Badge variant={variant}>{label}</Badge>
}

function StatusBadge({ status }: { status: ResourceRow['status'] }) {
  const map: Record<ResourceRow['status'], { label: string; variant: 'success' | 'secondary' | 'danger' }> = {
    published: { label: 'Published', variant: 'success' },
    draft:     { label: 'Draft',     variant: 'secondary' },
    archived:  { label: 'Archived',  variant: 'danger' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'secondary' }
  return <Badge variant={variant}>{label}</Badge>
}

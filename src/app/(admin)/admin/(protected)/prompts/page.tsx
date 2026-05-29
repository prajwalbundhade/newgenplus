/**
 * Admin prompts management — /admin/prompts
 * Authorization enforced by AdminLayout.
 */

import { Plus, Sparkles, Search } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/admin/PageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

async function getResources(): Promise<ResourceRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    return (data as ResourceRow[] | null) ?? []
  } catch {
    return []
  }
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
          <Button variant="primary" size="md">
            <Plus size={15} />
            New Prompt
          </Button>
        }
      />

      <Separator />

      <div className="px-8 py-6">
        {resources.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No prompts yet"
            description="Create your first AI prompt to get started."
            action={
              <Button variant="primary" size="md">
                <Plus size={15} />
                New Prompt
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border border-[#F0EBE5] bg-white overflow-hidden">
            {/* Search bar */}
            <div className="flex items-center gap-3 border-b border-[#F0EBE5] px-4 py-3">
              <Search size={15} className="shrink-0 text-[#999999]" />
              <input
                type="search"
                placeholder="Search prompts…"
                className="flex-1 bg-transparent text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none"
              />
              <span className="text-xs text-[#999999]">{resources.length} total</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Copies</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <ResourceRow key={resource.id} resource={resource} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Row component ────────────────────────────────────────────────────────────

function ResourceRow({ resource }: { resource: ResourceRow }) {
  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium text-[#111111] line-clamp-1">{resource.title}</p>
          <p className="text-xs text-[#999999] mt-0.5">/{resource.slug}</p>
        </div>
      </TableCell>
      <TableCell>
        <ResourceTypeBadge type={resource.resource_type} />
      </TableCell>
      <TableCell>
        <StatusBadge status={resource.status} />
      </TableCell>
      <TableCell className="text-right tabular-nums text-[#666666]">
        {resource.view_count.toLocaleString()}
      </TableCell>
      <TableCell className="text-right tabular-nums text-[#666666]">
        {resource.copy_count.toLocaleString()}
      </TableCell>
      <TableCell className="text-[#999999]">
        {formatDate(resource.created_at)}
      </TableCell>
      <TableCell>
        <button
          className="rounded-md p-1.5 text-[#999999] hover:bg-[#FFF9F5] hover:text-[#FF6B35] transition-colors"
          aria-label={`Edit ${resource.title}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </TableCell>
    </TableRow>
  )
}

function ResourceTypeBadge({ type }: { type: ResourceRow['resource_type'] }) {
  const map: Record<ResourceRow['resource_type'], { label: string; variant: 'default' | 'info' | 'secondary' | 'warning' }> = {
    image:       { label: 'Image',       variant: 'default' },
    video:       { label: 'Video',       variant: 'info' },
    'website-kit': { label: 'Website Kit', variant: 'warning' },
    workflow:    { label: 'Workflow',    variant: 'secondary' },
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

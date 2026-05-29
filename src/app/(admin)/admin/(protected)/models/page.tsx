/**
 * Admin models management — /admin/models
 * Authorization enforced by AdminLayout.
 */

import { Plus, Cpu } from 'lucide-react'
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
import type { ModelRow } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Models — NewGenPlus Admin',
  robots: 'noindex, nofollow',
}

async function getModels(): Promise<ModelRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('models')
      .select('*')
      .order('name', { ascending: true })
    return (data as ModelRow[] | null) ?? []
  } catch {
    return []
  }
}

export default async function AdminModelsPage() {
  const models = await getModels()

  return (
    <div className="min-h-full">
      <PageHeader
        title="AI Models"
        description="Manage the AI models associated with prompts."
        actions={
          <Button variant="primary" size="md">
            <Plus size={15} />
            New Model
          </Button>
        }
      />

      <Separator />

      <div className="px-8 py-6">
        {models.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="No models yet"
            description="Add AI models like Midjourney, GPT-4o, or DALL·E to tag prompts."
            action={
              <Button variant="primary" size="md">
                <Plus size={15} />
                New Model
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border border-[#F0EBE5] bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F0EBE5] px-5 py-3">
              <span className="text-xs font-medium text-[#999999]">
                {models.length} {models.length === 1 ? 'model' : 'models'}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <ModelTableRow key={model.id} model={model} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

function ModelTableRow({ model }: { model: ModelRow }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {/* Logo placeholder */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF9F5] border border-[#F0EBE5]">
            <Cpu size={14} className="text-[#999999]" />
          </div>
          <div>
            <p className="font-medium text-[#111111]">{model.name}</p>
            {model.description && (
              <p className="mt-0.5 text-xs text-[#999999] line-clamp-1">{model.description}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {model.provider ? (
          <span className="text-sm text-[#666666]">{model.provider}</span>
        ) : (
          <span className="text-xs text-[#999999]">—</span>
        )}
      </TableCell>
      <TableCell>
        <code className="rounded bg-[#FFF9F5] px-1.5 py-0.5 text-xs text-[#FF6B35]">
          {model.slug}
        </code>
      </TableCell>
      <TableCell>
        <ModelStatusBadge status={model.status} />
      </TableCell>
      <TableCell className="text-[#999999]">
        {new Date(model.created_at).toLocaleDateString('en', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </TableCell>
      <TableCell>
        <button
          className="rounded-md p-1.5 text-[#999999] hover:bg-[#FFF9F5] hover:text-[#FF6B35] transition-colors"
          aria-label={`Edit ${model.name}`}
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

function ModelStatusBadge({ status }: { status: ModelRow['status'] }) {
  const map: Record<ModelRow['status'], { label: string; variant: 'success' | 'secondary' | 'danger' }> = {
    published: { label: 'Published', variant: 'success' },
    draft:     { label: 'Draft',     variant: 'secondary' },
    archived:  { label: 'Archived',  variant: 'danger' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'secondary' }
  return <Badge variant={variant}>{label}</Badge>
}

/**
 * Admin categories management — /admin/categories
 * Authorization enforced by AdminLayout.
 */

import { Plus, Tag } from 'lucide-react'
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
import type { CategoryRow } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Categories — NewGenPlus Admin',
  robots: 'noindex, nofollow',
}

async function getCategories(): Promise<CategoryRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    return (data as CategoryRow[] | null) ?? []
  } catch {
    return []
  }
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-full">
      <PageHeader
        title="Categories"
        description="Organise prompts into browsable categories."
        actions={
          <Button variant="primary" size="md">
            <Plus size={15} />
            New Category
          </Button>
        }
      />

      <Separator />

      <div className="px-8 py-6">
        {categories.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No categories yet"
            description="Add categories to help users discover prompts by topic."
            action={
              <Button variant="primary" size="md">
                <Plus size={15} />
                New Category
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border border-[#F0EBE5] bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F0EBE5] px-5 py-3">
              <span className="text-xs font-medium text-[#999999]">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, index) => (
                  <CategoryTableRow key={category.id} category={category} index={index + 1} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryTableRow({ category, index }: { category: CategoryRow; index: number }) {
  return (
    <TableRow>
      <TableCell className="text-[#999999] tabular-nums">{index}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-[#111111]">{category.name}</p>
          {category.description && (
            <p className="mt-0.5 text-xs text-[#999999] line-clamp-1">{category.description}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <code className="rounded bg-[#FFF9F5] px-1.5 py-0.5 text-xs text-[#FF6B35]">
          {category.slug}
        </code>
      </TableCell>
      <TableCell>
        {category.icon ? (
          <span className="text-base">{category.icon}</span>
        ) : (
          <span className="text-xs text-[#999999]">—</span>
        )}
      </TableCell>
      <TableCell>
        <CategoryStatusBadge status={category.status} />
      </TableCell>
      <TableCell className="text-[#999999]">
        {new Date(category.created_at).toLocaleDateString('en', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </TableCell>
      <TableCell>
        <button
          className="rounded-md p-1.5 text-[#999999] hover:bg-[#FFF9F5] hover:text-[#FF6B35] transition-colors"
          aria-label={`Edit ${category.name}`}
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

function CategoryStatusBadge({ status }: { status: CategoryRow['status'] }) {
  const map: Record<CategoryRow['status'], { label: string; variant: 'success' | 'secondary' | 'danger' }> = {
    published: { label: 'Published', variant: 'success' },
    draft:     { label: 'Draft',     variant: 'secondary' },
    archived:  { label: 'Archived',  variant: 'danger' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'secondary' }
  return <Badge variant={variant}>{label}</Badge>
}

/**
 * Category & Model validation schemas (Zod).
 * Mirror the database CHECK constraints.
 */
import { z } from 'zod'

const STATUSES = ['draft', 'published', 'archived'] as const

export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  icon: z.string().trim().max(100).optional().or(z.literal('')),
  sort_order: z.coerce.number().int().min(0).default(0),
  status: z.enum(STATUSES).default('published'),
})

export const CategoryUpdateSchema = CategoryCreateSchema.partial().extend({
  id: z.uuid(),
})

export const ModelCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  provider: z.string().trim().max(100).optional().or(z.literal('')),
  status: z.enum(STATUSES).default('published'),
})

export const ModelUpdateSchema = ModelCreateSchema.partial().extend({
  id: z.uuid(),
})

export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>
export type ModelCreateInput = z.infer<typeof ModelCreateSchema>

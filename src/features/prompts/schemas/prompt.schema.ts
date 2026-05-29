/**
 * Prompt validation schemas (Zod).
 *
 * Shared by the admin create/update Server Actions. The same constraints
 * mirror the database CHECKs so invalid data is rejected before the DB call.
 */
import { z } from 'zod'

const RESOURCE_TYPES = ['image', 'video', 'website-kit', 'workflow'] as const
const STATUSES = ['draft', 'published', 'archived'] as const

/** Accepts a comma/whitespace separated tag string or array → string[] */
const tagsField = z
  .string()
  .optional()
  .transform((val) =>
    (val ?? '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20)
  )

export const PromptCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(300),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  prompt_text: z.string().trim().min(1, 'Prompt text is required.').max(8000),
  creator_name: z.string().trim().min(1).max(100).default('NewGenPlus'),
  resource_type: z.enum(RESOURCE_TYPES).default('image'),
  category_id: z.uuid().nullable().optional(),
  model_id: z.uuid().nullable().optional(),
  tags: tagsField,
  status: z.enum(STATUSES).default('draft'),
  is_featured: z.boolean().default(false),
})

export const PromptUpdateSchema = PromptCreateSchema.partial().extend({
  id: z.uuid(),
})

export type PromptCreateInput = z.infer<typeof PromptCreateSchema>
export type PromptUpdateInput = z.infer<typeof PromptUpdateSchema>

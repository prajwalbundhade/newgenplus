/**
 * Prompt validation schemas (Zod).
 *
 * Shared by the admin create/update Server Actions. The same constraints
 * mirror the database CHECKs so invalid data is rejected before the DB call.
 */
import { z } from 'zod'

const RESOURCE_TYPES = ['image', 'video', 'website-kit', 'workflow'] as const
const STATUSES = ['draft', 'published', 'archived'] as const

/**
 * Lenient UUID-shape validator.
 *
 * Zod 4's z.uuid() enforces RFC 4122 version/variant bits and rejects valid
 * Postgres uuids that don't conform (e.g. seed ids like
 * 11111111-0000-0000-0000-000000000001). Postgres accepts any 8-4-4-4-12 hex
 * string, so we validate that shape instead.
 */
const uuidLike = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid id.'
  )

/** Required FK select: must be a uuid-like id (empty selection is rejected). */
const requiredId = (label: string) =>
  z
    .string({ message: `${label} is required.` })
    .min(1, `${label} is required.`)
    .pipe(uuidLike)

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
  category_id: requiredId('Category'),
  model_id: requiredId('Model'),
  tags: tagsField,
  status: z.enum(STATUSES).default('draft'),
  is_featured: z.boolean().default(false),
})

/**
 * Update schema: all content fields optional (partial edits), but when
 * category_id / model_id are provided they must be valid and non-empty.
 */
export const PromptUpdateSchema = z.object({
  id: uuidLike,
  title: z.string().trim().min(1, 'Title is required.').max(300).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  prompt_text: z.string().trim().min(1, 'Prompt text is required.').max(8000).optional(),
  creator_name: z.string().trim().min(1).max(100).optional(),
  resource_type: z.enum(RESOURCE_TYPES).optional(),
  category_id: requiredId('Category').optional(),
  model_id: requiredId('Model').optional(),
  tags: tagsField,
  status: z.enum(STATUSES).optional(),
  is_featured: z.boolean().optional(),
})

export type PromptCreateInput = z.infer<typeof PromptCreateSchema>
export type PromptUpdateInput = z.infer<typeof PromptUpdateSchema>

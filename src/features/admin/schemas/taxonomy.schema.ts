/**
 * Category & Model validation schemas (Zod).
 * Mirror the database CHECK constraints.
 */
import { z } from 'zod'

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

export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  icon: z.string().trim().max(100).optional().or(z.literal('')),
  sort_order: z.coerce.number().int().min(0).default(0),
  status: z.enum(STATUSES).default('published'),
})

export const CategoryUpdateSchema = CategoryCreateSchema.partial().extend({
  id: uuidLike,
})

/**
 * `logo_path` is stored as a base64 data URL (e.g. `data:image/png;base64,…`).
 * We accept the standard image mime types and cap the encoded size so a
 * pathological upload can't blow past the 5 MB server-action body limit.
 */
const LOGO_MAX_CHARS = 4 * 1024 * 1024 // ~4 MB of base64 text
const LogoDataUrl = z
  .string()
  .regex(
    /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/,
    'Logo must be an image data URL.'
  )
  .max(LOGO_MAX_CHARS, 'Logo image is too large.')

export const ModelCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  provider: z.string().trim().max(100).optional().or(z.literal('')),
  /** Empty string means "clear the logo"; absent means "leave unchanged". */
  logo_path: LogoDataUrl.optional().or(z.literal('')),
  status: z.enum(STATUSES).default('published'),
})

export const ModelUpdateSchema = ModelCreateSchema.partial().extend({
  id: uuidLike,
})

export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>
export type ModelCreateInput = z.infer<typeof ModelCreateSchema>

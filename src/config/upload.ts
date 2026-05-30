/**
 * Upload limits shared by the client form and the server action.
 */

/** Maximum cover image size, in bytes (3 MB). */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024

/** Human-readable label for messages. */
export const MAX_IMAGE_LABEL = '3 MB'

/** Accepted image mime types for cover uploads. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
] as const

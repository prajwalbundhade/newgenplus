/**
 * Storage URL helpers.
 *
 * Constructs public object URLs for Supabase Storage buckets without needing
 * a client instance. Public buckets serve read-only at a deterministic path.
 */
import { clientEnv } from '@/config/env'

const PUBLIC_BASE = `${clientEnv.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public`

/**
 * Build the public URL for an object in a public bucket.
 *   publicStorageUrl('resource-images', 'abc/cover.webp')
 *   → https://<project>.supabase.co/storage/v1/object/public/resource-images/abc/cover.webp
 */
export function publicStorageUrl(bucket: string, path: string): string {
  const cleanPath = path.replace(/^\/+/, '')
  return `${PUBLIC_BASE}/${bucket}/${cleanPath}`
}

/** Bucket names used across the app (mirror migration 006). */
export const STORAGE_BUCKETS = {
  resourceImages: 'resource-images',
  resourceVideos: 'resource-videos',
  resourceKits: 'resource-kits',
  modelLogos: 'model-logos',
  categoryIcons: 'category-icons',
  ogImages: 'og-images',
  adminUploads: 'admin-uploads',
} as const

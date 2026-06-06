/**
 * Server-side image optimization using Sharp.
 *
 * Produces two WebP outputs from any uploaded image:
 *   - Full:      max 1200 px wide, quality 90
 *   - Thumbnail: max 400 px wide,  quality 80
 *
 * Both preserve aspect ratio. Dimensions returned reflect the actual
 * output size (not the original), so the DB always stores accurate values.
 *
 * Server-only — never imported by client components.
 */
import 'server-only'

import sharp from 'sharp'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimizedImage {
  /** Processed image bytes ready for upload. */
  buffer: Buffer
  /** Always 'image/webp'. */
  mimeType: 'image/webp'
  /** Actual output width in pixels. */
  width: number
  /** Actual output height in pixels. */
  height: number
  /** File size in bytes. */
  fileSizeBytes: number
}

export interface OptimizationResult {
  full: OptimizedImage
  thumbnail: OptimizedImage
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FULL_MAX_WIDTH = 1200
const FULL_QUALITY = 100

const THUMB_MAX_WIDTH = 400
const THUMB_QUALITY = 100

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Process an uploaded image buffer into optimized full + thumbnail WebP outputs.
 *
 * @param input - Raw bytes from the uploaded file (any format Sharp supports)
 */
export async function optimizeImage(input: ArrayBuffer): Promise<OptimizationResult> {
  const inputBuffer = Buffer.from(input)

  // Run both transforms concurrently for speed.
  const [full, thumbnail] = await Promise.all([
    processVariant(inputBuffer, FULL_MAX_WIDTH, FULL_QUALITY),
    processVariant(inputBuffer, THUMB_MAX_WIDTH, THUMB_QUALITY),
  ])

  return { full, thumbnail }
}

async function processVariant(
  inputBuffer: Buffer,
  maxWidth: number,
  quality: number
): Promise<OptimizedImage> {
  const pipeline = sharp(inputBuffer)
    .rotate() // auto-correct EXIF orientation
    .resize({
      width: maxWidth,
      withoutEnlargement: true, // never upscale
      fit: 'inside',
    })
    .webp({ quality })

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })

  return {
    buffer: data,
    mimeType: 'image/webp',
    width: info.width,
    height: info.height,
    fileSizeBytes: info.size,
  }
}

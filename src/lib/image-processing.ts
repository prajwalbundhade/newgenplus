'use client'

/**
 * Client-side image processing.
 *
 * Captures natural dimensions and generates a tiny blurred LQIP data URL
 * from a File before upload — no server round-trip, no extra dependency.
 * Dimensions eliminate CLS in the masonry grid; the blur powers instant
 * blur-up placeholders (ARCHITECTURE §6.3).
 */

export interface ProcessedImage {
  width: number
  height: number
  blurDataUrl: string
}

/** Load a File into an HTMLImageElement. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image.'))
    }
    img.src = url
  })
}

/**
 * Read an image File: returns its natural size and a ~20px-wide blurred
 * JPEG data URL suitable for next/image `blurDataURL`.
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  const img = await loadImage(file)
  const width = img.naturalWidth
  const height = img.naturalHeight

  // Downscale to a tiny placeholder keeping aspect ratio.
  const TARGET = 20
  const ratio = height === 0 ? 1 : width / height
  const lqipW = ratio >= 1 ? TARGET : Math.max(1, Math.round(TARGET * ratio))
  const lqipH = ratio >= 1 ? Math.max(1, Math.round(TARGET / ratio)) : TARGET

  const canvas = document.createElement('canvas')
  canvas.width = lqipW
  canvas.height = lqipH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { width, height, blurDataUrl: '' }
  }
  ctx.drawImage(img, 0, 0, lqipW, lqipH)
  const blurDataUrl = canvas.toDataURL('image/jpeg', 0.5)

  return { width, height, blurDataUrl }
}

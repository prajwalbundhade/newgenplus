'use client'

/**
 * Convert a picked image File into a base64 PNG data URL suitable for
 * `models.logo_path`. The image is contained inside a square canvas of
 * `maxSize` px (default 192) on a transparent background, which:
 *  - keeps the encoded payload small (<~50 KB for typical brand marks),
 *  - normalises mixed-aspect logos to a single visual size,
 *  - preserves transparency for PNG/WebP/SVG inputs.
 *
 * SVG inputs are rasterised via a Blob URL so the stored `logo_path` is a
 * standalone PNG data URL and `<img src>` rendering does not depend on
 * CSP/sandbox rules around inline SVG.
 */

export interface LogoEncodeOptions {
  /** Max edge length of the output square in px. */
  maxSize?: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image.'))
    img.src = src
  })
}

/**
 * Read a File as a base64 PNG data URL fitted into a transparent square.
 * Throws if the browser cannot decode the file as an image.
 */
export async function fileToLogoDataUrl(
  file: File,
  options: LogoEncodeOptions = {}
): Promise<string> {
  const { maxSize = 192 } = options

  const objectUrl = URL.createObjectURL(file)
  let img: HTMLImageElement
  try {
    img = await loadImage(objectUrl)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }

  const naturalW = img.naturalWidth || maxSize
  const naturalH = img.naturalHeight || maxSize
  const scale = Math.min(maxSize / naturalW, maxSize / naturalH, 1)
  const drawW = Math.max(1, Math.round(naturalW * scale))
  const drawH = Math.max(1, Math.round(naturalH * scale))

  const canvas = document.createElement('canvas')
  canvas.width = maxSize
  canvas.height = maxSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available in this browser.')

  // Transparent square backdrop, image centred.
  ctx.clearRect(0, 0, maxSize, maxSize)
  const dx = Math.round((maxSize - drawW) / 2)
  const dy = Math.round((maxSize - drawH) / 2)
  ctx.drawImage(img, dx, dy, drawW, drawH)

  return canvas.toDataURL('image/png')
}

/**
 * Apple touch icon — auto-served at /apple-icon (180×180 PNG).
 *
 * Generated with next/og so we don't have to commit a binary; mirrors the
 * brand mark used in app/icon.svg.
 */
import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #FF6B35, #FFB26B)',
          color: '#fff',
          fontSize: 120,
          fontWeight: 800,
        }}
      >
        N
      </div>
    ),
    { ...size }
  )
}

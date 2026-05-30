/**
 * Shared Open Graph image template.
 *
 * Returns the JSX tree rendered by `next/og`'s ImageResponse (satori). Kept in
 * one place so the default site card and per-prompt cards share identical
 * branding. Only a flexbox subset of CSS is supported by satori — no grid, no
 * external CSS — so styles are inline and layout uses flex.
 *
 * NOTE: this file exports a plain function returning JSX; the ImageResponse is
 * constructed by the route/file that imports it (those run on the edge/runtime
 * where ImageResponse is available).
 */
import type { ReactElement } from 'react'
import { OG_BRAND } from '@/config/seo'
import { siteConfig } from '@/config/site'

export interface OgTemplateInput {
  /** Main headline (prompt title or site tagline). */
  title: string
  /** Optional eyebrow above the title (e.g. model name, "AI Prompt"). */
  eyebrow?: string | null
  /** Optional attribution line (e.g. "by Creator"). */
  footerNote?: string | null
  /** Optional preview image URL composited on the right. */
  imageUrl?: string | null
}

/** Wordmark used in the corner of every card. */
function Wordmark(): ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${OG_BRAND.primary}, ${OG_BRAND.accent})`,
          color: '#fff',
          fontSize: 38,
          fontWeight: 800,
        }}
      >
        N
      </div>
      <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: OG_BRAND.text }}>
        {siteConfig.name}
      </div>
    </div>
  )
}

export function OgTemplate({ title, eyebrow, footerNote, imageUrl }: OgTemplateInput): ReactElement {
  const safeTitle = title.length > 110 ? `${title.slice(0, 107)}…` : title

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: OG_BRAND.background,
        padding: 64,
        position: 'relative',
      }}
    >
      {/* Left: text column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          paddingRight: imageUrl ? 48 : 0,
        }}
      >
        <Wordmark />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {eyebrow ? (
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                background: '#fff',
                border: `2px solid ${OG_BRAND.accent}`,
                color: OG_BRAND.primary,
                fontSize: 26,
                fontWeight: 600,
                padding: '8px 20px',
                borderRadius: 999,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              lineHeight: 1.1,
              fontWeight: 800,
              color: OG_BRAND.text,
            }}
          >
            {safeTitle}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 28, color: OG_BRAND.muted }}>
          {footerNote ?? siteConfig.tagline}
        </div>
      </div>

      {/* Right: preview image (optional) */}
      {imageUrl ? (
        <div
          style={{
            display: 'flex',
            width: 420,
            height: '100%',
            borderRadius: 28,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            width={420}
            height={502}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : null}

      {/* Bottom accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: 12,
          background: `linear-gradient(90deg, ${OG_BRAND.primary}, ${OG_BRAND.accent})`,
        }}
      />
    </div>
  )
}

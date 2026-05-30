/**
 * ModelIcon — a colorful, brand-themed badge for an AI model.
 *
 * Server-renderable. Resolves a visual from the model's name/slug/provider via
 * keyword detection (robust even when admin-created slugs carry a random
 * suffix). Each model gets a distinct gradient + monogram; a few standout
 * models (Nano Banana, Meta, Grok) get a custom glyph. Unknown models fall back
 * to a neutral brand badge with their initials.
 */

import { cn } from '@/lib/utils'

interface ModelVisual {
  /** CSS background (gradient or solid). */
  background: string
  /** Foreground/text colour. */
  color: string
  /** 1–3 char monogram shown when no custom glyph. */
  label: string
  /** Optional custom SVG glyph (overrides the monogram). */
  glyph?: 'banana' | 'meta' | 'grok'
}

/** Ordered keyword → visual rules. First match wins. */
const RULES: { match: RegExp; visual: ModelVisual }[] = [
  {
    match: /nano\s*banana|banana/i,
    visual: { background: 'linear-gradient(135deg,#FFE259,#FFA751)', color: '#7A4A00', label: 'NB', glyph: 'banana' },
  },
  {
    match: /chatgpt|gpt[\s-]*image|gpt/i,
    visual: { background: 'linear-gradient(135deg,#10A37F,#0E8C6D)', color: '#FFFFFF', label: 'GPT' },
  },
  {
    match: /dall[\s·.-]*e|dalle/i,
    visual: { background: 'linear-gradient(135deg,#19C37D,#10A37F)', color: '#FFFFFF', label: 'D' },
  },
  {
    match: /midjourney|mid\s*journey/i,
    visual: { background: 'linear-gradient(135deg,#0B0B0F,#2B2B33)', color: '#FFFFFF', label: 'MJ' },
  },
  {
    match: /flux/i,
    visual: { background: 'linear-gradient(135deg,#111111,#3A3A3A)', color: '#FFFFFF', label: 'FX' },
  },
  {
    match: /stable\s*diffusion|sdxl|sd\b/i,
    visual: { background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#FFFFFF', label: 'SD' },
  },
  {
    match: /firefly|adobe/i,
    visual: { background: 'linear-gradient(135deg,#FF3B30,#FF8A00)', color: '#FFFFFF', label: 'Ff' },
  },
  {
    match: /ideogram/i,
    visual: { background: 'linear-gradient(135deg,#FF5F6D,#7C3AED)', color: '#FFFFFF', label: 'Id' },
  },
  {
    match: /leonardo/i,
    visual: { background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#FFFFFF', label: 'Le' },
  },
  {
    match: /grok|xai/i,
    visual: { background: 'linear-gradient(135deg,#111111,#444444)', color: '#FFFFFF', label: 'Gk', glyph: 'grok' },
  },
  {
    match: /meta|llama|imagine/i,
    visual: { background: 'linear-gradient(135deg,#0064E0,#00C6FF)', color: '#FFFFFF', label: 'M', glyph: 'meta' },
  },
  {
    match: /gemini|google|imagen/i,
    visual: { background: 'linear-gradient(135deg,#4285F4,#34A853 60%,#FBBC05)', color: '#FFFFFF', label: 'G' },
  },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function resolveVisual(name: string, slug?: string, provider?: string | null): ModelVisual {
  const haystack = `${name} ${slug ?? ''} ${provider ?? ''}`
  for (const rule of RULES) {
    if (rule.match.test(haystack)) return rule.visual
  }
  return {
    background: 'linear-gradient(135deg,#FF6B35,#FFB26B)',
    color: '#FFFFFF',
    label: initials(name),
  }
}

/** Returns true when the model maps to a named/branded visual rule. */
export function hasBrandedLogo(
  name: string,
  slug?: string,
  provider?: string | null,
  logo_path?: string | null   // ← add
): boolean {
  if (logo_path) return true  // ← always show icon if DB has a logo
  const haystack = `${name} ${slug ?? ''} ${provider ?? ''}`
  return RULES.some((rule) => rule.match.test(haystack))
}

const SIZE: Record<NonNullable<ModelIconProps['size']>, { box: string; text: string; glyph: number }> = {
  sm: { box: 'h-5 w-5 rounded-md', text: 'text-[9px]', glyph: 12 },
  md: { box: 'h-8 w-8 rounded-lg', text: 'text-xs', glyph: 18 },
  lg: { box: 'h-12 w-12 rounded-xl', text: 'text-base', glyph: 26 },
}

interface ModelIconProps {
  name: string
  slug?: string
  provider?: string | null
  logo_path?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface ModelIconProps {
  name: string
  slug?: string
  provider?: string | null
  logo_path?: string | null   // ← add this
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ModelIcon({ name, slug, provider, logo_path, size = 'md', className }: ModelIconProps) {
  const visual = resolveVisual(name, slug, provider)
  const dims = SIZE[size]

  // If we have a real logo from the DB, render it directly
  if (logo_path) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center overflow-hidden',
          dims.box,
          className
        )}
      >
        <img src={logo_path} alt={name} className="h-full w-full object-contain" />
      </span>
    )
  }

  // fallback to gradient + monogram/glyph
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-bold leading-none shadow-sm',
        dims.box,
        dims.text,
        className
      )}
      style={{ background: visual.background, color: visual.color }}
      aria-hidden
    >
      {visual.glyph ? <Glyph kind={visual.glyph} size={dims.glyph} /> : visual.label}
    </span>
  )
}

function Glyph({ kind, size }: { kind: NonNullable<ModelVisual['glyph']>; size: number }) {
  if (kind === 'banana') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 6c0 6 4 11 11 12 1 .1 1.6-.2 1.9-.9.3-.7 0-1.3-.7-1.7C11.8 12.9 8.8 9 8.4 5.2 8.3 4.4 7.8 4 7.1 4 6 4 5 4.9 5 6z"
          fill="#7A4A00"
        />
        <path
          d="M6 6.2c.4 5 3.9 9.4 9.4 10.7-4.1-2.2-6.8-5.9-7.4-10.2-.1-.6-.4-.9-1-.9-.6 0-1 .3-1 .4z"
          fill="#FFF4C2"
          opacity="0.5"
        />
      </svg>
    )
  }
  if (kind === 'meta') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 15c0-3.5 1.6-7 4-7 1.7 0 2.9 1.6 4 3.8C16.1 9.6 17.3 8 19 8c2.4 0 4 3.5 4 7M3 15c0 1.8 1 3 2.4 3 2.2 0 3.4-2.4 4.6-4.8M21 15c0 1.8-1 3-2.4 3-2.2 0-3.4-2.4-4.6-4.8"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    )
  }
  // grok — stylised slash mark
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 18L16 6M11 18l5-6" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Typed Google Analytics (GA4) event layer.
 *
 * A FIXED event vocabulary (ARCHITECTURE §11.2) — call these helpers instead
 * of touching `window.gtag` directly, so events stay consistent and new ones
 * are added in one place. All calls are safe no-ops when GA hasn't loaded
 * (dev, ad-blockers, SSR), so callers never need to guard.
 *
 * This file is client-safe: it only reads `window` inside functions that run
 * in the browser.
 */
import { GA_MEASUREMENT_ID, ANALYTICS_ENABLED } from '@/config/seo'

type GtagArgs =
  | ['js', Date]
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>?]
  | ['set', Record<string, unknown>]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
  }
}

function canTrack(): boolean {
  return (
    ANALYTICS_ENABLED &&
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function'
  )
}

/** Record a virtual pageview on client-side route changes (SPA navigation). */
export function pageview(url: string): void {
  if (!canTrack()) return
  window.gtag!('config', GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

/** Low-level event sender. Prefer the named helpers below. */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (!canTrack()) return
  window.gtag!('event', name, params)
}

// ---------------------------------------------------------------------------
// Named events — the platform's analytics vocabulary
// ---------------------------------------------------------------------------

export function trackPromptView(params: { slug: string; title: string; model?: string | null }): void {
  trackEvent('prompt_view', {
    prompt_slug: params.slug,
    prompt_title: params.title,
    model_name: params.model ?? undefined,
  })
}

export function trackPromptCopy(params: { slug?: string; resourceId: string; title?: string }): void {
  trackEvent('prompt_copy', {
    prompt_slug: params.slug,
    resource_id: params.resourceId,
    prompt_title: params.title,
  })
}

export function trackSearch(term: string, resultsCount?: number): void {
  trackEvent('search', {
    search_term: term,
    ...(typeof resultsCount === 'number' ? { results_count: resultsCount } : {}),
  })
}

export function trackPromptShare(params: { slug: string; method?: string }): void {
  trackEvent('share', {
    prompt_slug: params.slug,
    method: params.method ?? 'web_share',
  })
}

export function trackFilterApplied(params: { type: 'category' | 'model' | 'sort'; value: string }): void {
  trackEvent('filter_applied', {
    filter_type: params.type,
    filter_value: params.value,
  })
}

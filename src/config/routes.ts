/**
 * Centralised route map.
 *
 * Every internal link uses these helpers instead of hardcoded path strings,
 * so route changes are a single-file edit and typos become type errors.
 */

export const routes = {
  // ── Public ──────────────────────────────────────────────────────────────
  home: '/',
  search: (query?: string) =>
    query ? `/search?q=${encodeURIComponent(query)}` : '/search',
  prompt: (slug: string) => `/prompt/${slug}`,
  promptOg: (slug: string) => `/og/prompt/${slug}`,
  category: (slug: string) => `/category/${slug}`,
  model: (slug: string) => `/model/${slug}`,
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',

  // ── Admin ───────────────────────────────────────────────────────────────
  admin: {
    dashboard: '/admin',
    login: '/admin/login',
    prompts: '/admin/prompts',
    categories: '/admin/categories',
    models: '/admin/models',
    reviews: '/admin/reviews',
    settings: '/admin/settings',
  },
} as const

export type Routes = typeof routes

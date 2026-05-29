/**
 * Slug helpers.
 *
 * Produces URL-safe, SEO-friendly slugs that satisfy the database CHECK
 * constraint: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 */

/**
 * Convert arbitrary text into a kebab-case slug.
 * Strips accents, lowercases, removes non-alphanumerics, collapses dashes.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics → dash
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    .replace(/-{2,}/g, '-') // collapse repeats
}

/**
 * Append a short random suffix to keep slugs unique when a base collides.
 * e.g. "golden-hour-portrait" → "golden-hour-portrait-a1b2c3"
 */
export function uniqueSlug(input: string): string {
  const base = slugify(input)
  const suffix = Math.random().toString(36).slice(2, 8)
  return base ? `${base}-${suffix}` : suffix
}

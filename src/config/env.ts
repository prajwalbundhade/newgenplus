/**
 * Environment variable validation.
 *
 * Validates required configuration at module load (boot) so the app fails
 * fast with a clear message rather than throwing deep in a request handler.
 *
 * Two surfaces:
 *   - clientEnv: NEXT_PUBLIC_* values, safe to reference in any bundle.
 *   - serverEnv: secrets that must NEVER reach the browser. Importing this
 *     module is safe from server code only; the values are read lazily so a
 *     stray client import won't embed the secret.
 *
 * Pattern: https://nextjs.org/docs/app/guides/environment-variables
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Client schema — NEXT_PUBLIC_* only
// ---------------------------------------------------------------------------

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL.',
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required.'),
  NEXT_PUBLIC_SITE_URL: z.url({
    message: 'NEXT_PUBLIC_SITE_URL must be a valid URL (no trailing slash).',
  }),
})

// Next.js inlines NEXT_PUBLIC_* by static reference, so we must list them
// explicitly rather than reading from a dynamic key.
const parsedClient = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
})

if (!parsedClient.success) {
  const issues = parsedClient.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(
    `Invalid public environment variables:\n${issues}\n` +
      'Check your .env.local file.'
  )
}

export const clientEnv = parsedClient.data

// ---------------------------------------------------------------------------
// Server schema — secrets, never exposed to the client bundle
// ---------------------------------------------------------------------------

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required (server-only).'),
})

/**
 * Lazily validate and return server-only env. Call this from server code
 * (Server Components, actions, route handlers). Throwing here keeps the
 * secret out of any client bundle because the function body never runs there.
 */
let cachedServerEnv: z.infer<typeof serverSchema> | null = null

export function getServerEnv(): z.infer<typeof serverSchema> {
  if (cachedServerEnv) return cachedServerEnv

  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(
      `Invalid server environment variables:\n${issues}\n` +
        'Check your .env.local file.'
    )
  }

  cachedServerEnv = parsed.data
  return cachedServerEnv
}

/**
 * The Supabase Storage hostname, derived from the project URL.
 * Used by next.config image remotePatterns and image URL helpers.
 */
export const supabaseHostname = new URL(clientEnv.NEXT_PUBLIC_SUPABASE_URL).hostname

/**
 * Server Supabase client.
 *
 * Use this in Server Components, Server Functions (actions), Route Handlers,
 * and the proxy (middleware). It reads/writes cookies via next/headers so the
 * session is available server-side and refreshed automatically.
 *
 * This module is server-only — it imports 'server-only' to cause a build
 * error if accidentally imported into a Client Component.
 */
import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  // cookies() is async in Next.js 16 — must be awaited
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll is called from a Server Component during rendering.
            // Cookies can only be set in Server Functions / Route Handlers.
            // The session will be refreshed by the proxy on the next request.
          }
        },
      },
    }
  )
}

/**
 * Browser Supabase client.
 *
 * Use this ONLY in Client Components ('use client').
 * It reads cookies via the @supabase/ssr browser helper so the session
 * is kept in sync with the server-side session automatically.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Admin (service-role) Supabase client.
 *
 * Bypasses Row Level Security. Use ONLY for privileged server-side operations
 * that require elevated access (e.g. verifying the admin_users allowlist from
 * the proxy where the anon client cannot read that table).
 *
 * NEVER import this in Client Components or expose the service role key.
 * This module is server-only.
 */
import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Singleton — reuse across requests in the same server process
let adminClient: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  if (adminClient) return adminClient

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Add it to .env.local (server-only, never NEXT_PUBLIC_).'
    )
  }

  adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // Disable auto-refresh — this client is used for one-off server calls
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return adminClient
}

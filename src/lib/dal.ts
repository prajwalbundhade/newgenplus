/**
 * Data Access Layer — Authentication & Authorization
 *
 * This is the SINGLE source of truth for session verification and admin
 * identity checks. All Server Components, Server Functions, and Route Handlers
 * must call these functions rather than querying Supabase directly for auth.
 *
 * Pattern recommended by the Next.js 16 data-security guide:
 *   - Use React.cache() so the same request only hits the DB once
 *   - Return minimal DTOs — never raw DB rows
 *   - Mark server-only to prevent accidental client import
 */
import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { AdminRole, AdminUserRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminSession {
  /** Supabase auth user id */
  userId: string
  /** Verified email from admin_users allowlist */
  email: string
  /** Role from admin_users table */
  role: AdminRole
}

// ---------------------------------------------------------------------------
// getAdminSession()
// ---------------------------------------------------------------------------
// Verifies the current request has:
//   1. A valid Supabase auth session
//   2. An email present in the admin_users allowlist
//
// Returns AdminSession if both checks pass, null otherwise.
//
// Wrapped in React.cache() — called multiple times in the same render tree
// (layout + page + server actions) but only executes once per request.
// ---------------------------------------------------------------------------

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  try {
    const supabase = await createClient()

    // 1. Verify Supabase auth session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // 2. Verify the user is in the admin_users allowlist
    // RLS on admin_users only allows reading own row, so this is safe with
    // the anon/user client — no service role needed here.
    //
    // Note: createServerClient<Database> doesn't propagate generics to .from()
    // so we explicitly cast the result to the admin_users row type.
    const result = await supabase
      .from('admin_users')
      .select('id,email,role')
      .eq('id', user.id)
      .single()

    const { data: adminUser, error: adminError } = result as {
      data: Pick<AdminUserRow, 'id' | 'email' | 'role'> | null
      error: typeof result.error
    }

    if (adminError || !adminUser) {
      return null
    }

    return {
      userId: user.id,
      email: adminUser.email,
      role: adminUser.role,
    }
  } catch {
    // Never throw from the DAL — return null and let callers decide
    return null
  }
})

// ---------------------------------------------------------------------------
// requireAdminSession()
// ---------------------------------------------------------------------------
// Like getAdminSession() but throws if the session is missing or invalid.
// Use in Server Functions (actions) where you want to hard-fail rather than
// return null.
// ---------------------------------------------------------------------------

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('Unauthorized: valid admin session required')
  }
  return session
}

// ---------------------------------------------------------------------------
// requireSuperAdmin()
// ---------------------------------------------------------------------------
// Requires the caller to be a super_admin. Use for destructive or
// privilege-escalation operations (hard-delete, managing other admins).
// ---------------------------------------------------------------------------

export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await requireAdminSession()
  if (session.role !== 'super_admin') {
    throw new Error('Forbidden: super_admin role required')
  }
  return session
}

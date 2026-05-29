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
import type { AdminRole } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminSession {
  /** Supabase auth user id */
  userId: string
  /** Verified email from the auth session */
  email: string
  /** Role derived from the admin_users allowlist */
  role: AdminRole
}

// ---------------------------------------------------------------------------
// getAdminSession()
// ---------------------------------------------------------------------------
// Verifies the current request has:
//   1. A valid Supabase auth session
//   2. Membership in the admin_users allowlist
//
// Returns AdminSession if both checks pass, null otherwise.
//
// IMPORTANT: allowlist membership is verified via the is_admin() /
// is_super_admin() SECURITY DEFINER functions, NOT a direct SELECT on
// admin_users. A direct read depends on the admin_users SELECT RLS policy
// (`USING (id = auth.uid())`), which is unreliable in this project's live DB.
// The SECURITY DEFINER functions check the same condition server-side and are
// the canonical, RLS-independent way to authorize.
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

    // 2. Verify allowlist membership + role via SECURITY DEFINER RPCs.
    //    Run in parallel — is_admin gates access, is_super_admin sets the tier.
    const [adminResult, superResult] = await Promise.all([
      supabase.rpc('is_admin'),
      supabase.rpc('is_super_admin'),
    ])

    const isAdmin = adminResult.data === true
    const isSuperAdmin = superResult.data === true

    if (adminResult.error || !isAdmin) {
      return null
    }

    return {
      userId: user.id,
      // Email comes from the verified auth session, not a table read.
      email: user.email ?? '',
      role: isSuperAdmin ? 'super_admin' : 'admin',
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

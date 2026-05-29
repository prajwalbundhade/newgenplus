/**
 * Authorization guard helpers for Server Functions (actions).
 *
 * Import these at the top of every admin Server Function to enforce
 * authentication and role-based authorization before any mutation.
 *
 * Usage:
 *   import { guardAdmin, guardSuperAdmin } from '@/lib/auth-guard'
 *
 *   export async function createPrompt(formData: FormData) {
 *     'use server'
 *     const session = await guardAdmin()
 *     // session.userId, session.email, session.role are available
 *     // ... perform mutation
 *   }
 */
import 'server-only'

import { requireAdminSession, requireSuperAdmin } from '@/lib/dal'
import type { AdminSession } from '@/lib/dal'

// ---------------------------------------------------------------------------
// guardAdmin()
// ---------------------------------------------------------------------------
// Requires an authenticated admin session (any role).
// Throws if unauthenticated or not in the admin_users allowlist.
// ---------------------------------------------------------------------------

export async function guardAdmin(): Promise<AdminSession> {
  return requireAdminSession()
}

// ---------------------------------------------------------------------------
// guardSuperAdmin()
// ---------------------------------------------------------------------------
// Requires super_admin role specifically.
// Use for: hard-deleting content, managing other admin accounts.
// ---------------------------------------------------------------------------

export async function guardSuperAdmin(): Promise<AdminSession> {
  return requireSuperAdmin()
}

// ---------------------------------------------------------------------------
// withAdminGuard()
// ---------------------------------------------------------------------------
// Higher-order wrapper for Server Functions.
// Reduces boilerplate when you have many actions in one file.
//
// Usage:
//   export const createPrompt = withAdminGuard(async (session, formData) => {
//     // session is guaranteed to be a valid AdminSession
//   })
// ---------------------------------------------------------------------------

type AdminAction<TArgs extends unknown[], TReturn> = (
  session: AdminSession,
  ...args: TArgs
) => Promise<TReturn>

export function withAdminGuard<TArgs extends unknown[], TReturn>(
  fn: AdminAction<TArgs, TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    const session = await guardAdmin()
    return fn(session, ...args)
  }
}

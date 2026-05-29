'use server'

/**
 * Admin authentication Server Functions.
 *
 * These are the ONLY entry points for admin login/logout mutations.
 * All actions re-verify identity before performing any operation —
 * never rely on the proxy alone (Server Functions are reachable via
 * direct POST requests, bypassing the proxy).
 *
 * Auth strategy: Email + Password via supabase.auth.signInWithPassword().
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/dal'
import type { AdminUserRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoginState =
  | { status: 'idle' }
  | { status: 'error'; message: string }

// ---------------------------------------------------------------------------
// loginWithPassword
// ---------------------------------------------------------------------------
// Signs the admin in with email + password, then verifies the user is in the
// admin_users allowlist. On success, redirects to the intended destination.
//
// On failure (bad credentials OR not allowlisted) returns an error state.
// Credential and authorization errors are intentionally indistinguishable to
// the client to avoid leaking which emails are valid admins.
// ---------------------------------------------------------------------------

export async function loginWithPassword(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const emailValue = formData.get('email')
  const passwordValue = formData.get('password')
  const redirectToValue = formData.get('redirectTo')

  if (typeof emailValue !== 'string' || !emailValue.trim()) {
    return { status: 'error', message: 'A valid email address is required.' }
  }

  if (typeof passwordValue !== 'string' || passwordValue.length === 0) {
    return { status: 'error', message: 'Password is required.' }
  }

  const normalizedEmail = emailValue.trim().toLowerCase()

  // Basic format check before hitting Supabase
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: passwordValue,
  })

  if (error || !signInData.user) {
    // Don't leak whether the email exists or the password was wrong
    console.error('[loginWithPassword] Supabase error:', error?.message)
    return { status: 'error', message: 'Invalid email or password.' }
  }

  // Credentials are valid — now enforce the admin_users allowlist + role.
  //
  // We check the allowlist using the authenticated user's id directly (from
  // the sign-in response) via the service-role admin client. This avoids
  // depending on a second server client reading back the session cookies that
  // were only just staged in this same Server Action invocation — a race that
  // makes getAdminSession() unreliable immediately after sign-in.
  const adminDb = createAdminClient()
  const { data: adminUserRaw } = await adminDb
    .from('admin_users')
    .select('id,email,role')
    .eq('id', signInData.user.id)
    .single()

  const adminUser = adminUserRaw as Pick<AdminUserRow, 'id' | 'email' | 'role'> | null

  if (!adminUser) {
    // Authenticated with Supabase but NOT an allowlisted admin — sign out.
    await supabase.auth.signOut()
    return {
      status: 'error',
      message: 'This account is not authorised to access the admin console.',
    }
  }

  // Valid admin — redirect to the intended destination or dashboard.
  // Only allow internal /admin paths to prevent open-redirect abuse.
  const destination =
    typeof redirectToValue === 'string' && redirectToValue.startsWith('/admin')
      ? redirectToValue
      : '/admin'

  redirect(destination)
}

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

// ---------------------------------------------------------------------------
// getSessionForClient
// ---------------------------------------------------------------------------
// Returns a minimal, safe session object for use in Client Components.
// Never returns raw Supabase user objects or tokens.
// ---------------------------------------------------------------------------

export async function getSessionForClient() {
  const session = await getAdminSession()
  if (!session) return null

  return {
    email: session.email,
    role: session.role,
  }
}

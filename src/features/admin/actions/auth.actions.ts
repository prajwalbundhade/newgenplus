'use server'

/**
 * Admin authentication Server Functions.
 *
 * These are the ONLY entry points for admin login/logout mutations.
 * All actions re-verify identity before performing any operation —
 * never rely on the proxy alone (Server Functions are reachable via
 * direct POST requests, bypassing the proxy).
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/dal'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoginState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success' }

// ---------------------------------------------------------------------------
// loginWithEmail
// ---------------------------------------------------------------------------
// Initiates a Supabase magic-link (OTP) email login.
// No password is involved — the admin receives a one-time link.
// ---------------------------------------------------------------------------

export async function loginWithEmail(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email')

  if (typeof email !== 'string' || !email.trim()) {
    return { status: 'error', message: 'A valid email address is required.' }
  }

  const normalizedEmail = email.trim().toLowerCase()

  // Basic format check before hitting Supabase
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      // Redirect back to the admin dashboard after clicking the magic link
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/auth/callback`,
      // Do NOT create new users — only existing admin_users entries are valid
      shouldCreateUser: false,
    },
  })

  if (error) {
    // Don't leak internal Supabase error details to the client
    console.error('[loginWithEmail] Supabase error:', error.message)
    return {
      status: 'error',
      message:
        'Unable to send login link. Check that your email is authorised.',
    }
  }

  return { status: 'success' }
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

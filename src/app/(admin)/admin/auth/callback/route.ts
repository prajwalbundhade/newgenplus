/**
 * Supabase Auth callback route.
 *
 * Handles the redirect from the magic-link email. Supabase appends a
 * `code` query parameter which must be exchanged for a session.
 *
 * After exchange, we verify the user is in the admin_users allowlist.
 * If not, we sign them out and redirect to login with an error.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/dal'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/admin'

  if (!code) {
    // No code — malformed callback, send to login
    return NextResponse.redirect(new URL('/admin/login?error=missing_code', origin))
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] Code exchange failed:', error.message)
    return NextResponse.redirect(
      new URL('/admin/login?error=auth_failed', origin)
    )
  }

  // Verify the authenticated user is an allowlisted admin
  const session = await getAdminSession()

  if (!session) {
    // Authenticated with Supabase but NOT in admin_users — sign out immediately
    await supabase.auth.signOut()
    return NextResponse.redirect(
      new URL('/admin/login?error=not_authorized', origin)
    )
  }

  // Valid admin — redirect to intended destination or dashboard
  const safeRedirect = redirectTo.startsWith('/admin') ? redirectTo : '/admin'
  return NextResponse.redirect(new URL(safeRedirect, origin))
}

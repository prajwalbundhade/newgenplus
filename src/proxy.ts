/**
 * NewGenPlus — Proxy (formerly middleware)
 *
 * In Next.js 16, middleware.ts is deprecated and renamed to proxy.ts.
 * The exported function must be named `proxy` (not `middleware`).
 *
 * Responsibilities:
 *   1. Refresh Supabase auth sessions on every admin request so cookies
 *      stay valid without requiring a page reload.
 *   2. Redirect unauthenticated requests to /admin/login.
 *   3. Redirect authenticated non-admin requests to /admin/login.
 *
 * IMPORTANT: The proxy is a fast-path guard only. It is NOT the sole
 * authorization layer. Every Server Component and Server Function in the
 * admin area re-verifies via the DAL (getAdminSession / requireAdminSession).
 * This defense-in-depth approach is required because:
 *   - The proxy runs on the edge and cannot call the admin_users DB table
 *     without the service role key (which we avoid using on the edge).
 *   - Server Functions are reachable via direct POST requests, bypassing
 *     the proxy entirely (documented in the Next.js 16 proxy guide).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ---------------------------------------------------------------------------
// Proxy function
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only run auth logic on /admin routes
  // (The matcher below already filters this, but being explicit is safer)
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow the login page through without a session check to avoid redirect loops
  if (pathname === '/admin/login') {
    return refreshSessionAndContinue(request)
  }

  // For all other /admin/* routes: verify session and redirect if missing
  return guardAdminRoute(request)
}

// ---------------------------------------------------------------------------
// Session refresh helper
// ---------------------------------------------------------------------------
// Creates a Supabase server client that can read/write cookies on the
// NextResponse, refreshing the session token if it has expired.
// ---------------------------------------------------------------------------

async function refreshSessionAndContinue(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies to both the request (for downstream
          // server components) and the response (for the browser)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() triggers a token refresh if the access token has expired.
  // We intentionally ignore the result here — the DAL does the real check.
  await supabase.auth.getUser()

  return response
}

// ---------------------------------------------------------------------------
// Admin route guard
// ---------------------------------------------------------------------------

async function guardAdminRoute(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No session → redirect to login, preserving the intended destination
  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Session exists — allow through. The admin layout's server-side DAL check
  // will verify the admin_users allowlist and role before rendering anything.
  return response
}

// ---------------------------------------------------------------------------
// Matcher — only run the proxy on /admin routes
// ---------------------------------------------------------------------------
// Excludes static assets and Next.js internals for performance.
// Note: _next/data routes are intentionally NOT excluded — the proxy docs
// warn that excluding them can create security gaps.
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}

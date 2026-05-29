/**
 * Admin login page.
 *
 * If the user already has a valid admin session, redirect them to the
 * dashboard immediately — no need to show the login form.
 *
 * Uses magic-link (OTP) email login via Supabase Auth.
 * No password, no public registration.
 */

import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/dal'
import { LoginForm } from '@/components/admin/LoginForm'

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // params are Promises in Next.js 16 — must be awaited
  const { redirectTo, error } = await searchParams

  // Already authenticated admin → skip login
  const session = await getAdminSession()
  if (session) {
    redirect(redirectTo?.startsWith('/admin') ? redirectTo : '/admin')
  }

  return (
    <LoginForm
      redirectTo={redirectTo}
      errorCode={error}
    />
  )
}

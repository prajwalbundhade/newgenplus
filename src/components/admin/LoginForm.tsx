'use client'

/**
 * LoginForm — Client Component.
 *
 * Magic-link email login form for the admin console.
 * Uses useActionState (React 19 / Next.js 16) to handle the server action
 * result and show pending/success/error states.
 */

import { useActionState } from 'react'
import { loginWithEmail } from '@/features/admin/actions/auth.actions'
import type { LoginState } from '@/features/admin/actions/auth.actions'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'The login link was invalid or expired. Please try again.',
  auth_failed: 'Authentication failed. Please request a new login link.',
  not_authorized: 'This email is not authorised to access the admin console.',
}

interface LoginFormProps {
  redirectTo?: string
  errorCode?: string
}

const initialState: LoginState = { status: 'idle' }

export function LoginForm({ redirectTo, errorCode }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginWithEmail, initialState)

  const urlError = errorCode ? ERROR_MESSAGES[errorCode] : null

  return (
    <div className="w-full max-w-sm">
      {/* Brand mark */}
      <div className="mb-8 text-center">
        <span className="text-2xl font-semibold text-[#FF6B35]">NewGenPlus</span>
        <p className="mt-1 text-sm text-gray-500">Admin Console</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-lg font-semibold text-[#111111] mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your admin email to receive a magic link.
        </p>

        {/* URL-level error (from callback redirect) */}
        {urlError && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
          >
            {urlError}
          </div>
        )}

        {/* Success state */}
        {state.status === 'success' ? (
          <div
            role="status"
            className="rounded-lg bg-green-50 border border-green-100 px-4 py-4 text-sm text-green-700"
          >
            <p className="font-medium">Check your email</p>
            <p className="mt-1 text-green-600">
              A magic link has been sent. Click it to sign in.
            </p>
          </div>
        ) : (
          <form action={action} noValidate>
            {/* Hidden field to preserve redirectTo through the action */}
            {redirectTo && (
              <input type="hidden" name="redirectTo" value={redirectTo} />
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-[#111111] placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 transition"
                />
              </div>

              {/* Action-level error */}
              {state.status === 'error' && (
                <p role="alert" className="text-sm text-red-600">
                  {state.message}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#FF8A4C] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 disabled:opacity-60 transition-colors"
              >
                {pending ? 'Sending…' : 'Send magic link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

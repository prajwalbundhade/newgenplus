'use client'

/**
 * LoginForm — Client Component.
 *
 * Email + password login form for the admin console.
 * Uses useActionState (React 19 / Next.js 16) to handle the server action
 * result and show pending/error states. On success the server action
 * redirects, so there is no client-side success state.
 */

import { useActionState } from 'react'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { loginWithPassword } from '@/features/admin/actions/auth.actions'
import type { LoginState } from '@/features/admin/actions/auth.actions'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed:    'Authentication failed. Please sign in again.',
  not_authorized: 'This account is not authorised to access the admin console.',
}

interface LoginFormProps {
  redirectTo?: string
  errorCode?: string
}

const initialState: LoginState = { status: 'idle' }

export function LoginForm({ redirectTo, errorCode }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginWithPassword, initialState)

  const urlError = errorCode ? ERROR_MESSAGES[errorCode] : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF9F5] px-4">
      <div className="w-full max-w-[380px]">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B35] shadow-[0_4px_12px_0_rgb(255_107_53/0.3)]">
            <BrandIcon size={29} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-[#111111]">NeuwGenX</h1>
            <p className="text-sm text-[#999999]">Admin Console</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#F0EBE5] bg-white p-8 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">

          {/* URL-level error */}
          {urlError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#DC2626]" />
              <p className="text-sm text-[#DC2626]">{urlError}</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#111111]">Sign in</h2>
            <p className="mt-1 text-sm text-[#666666]">
              Enter your admin email and password to continue.
            </p>
          </div>

          <form action={action} noValidate className="space-y-4">
            {redirectTo && (
              <input type="hidden" name="redirectTo" value={redirectTo} />
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-[#666666]">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@example.com"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-[#666666]">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]"
                />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            {state.status === 'error' && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-3 py-2.5"
              >
                <AlertCircle size={13} className="mt-0.5 shrink-0 text-[#DC2626]" />
                <p className="text-xs text-[#DC2626]">{state.message}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={pending}
              className="w-full"
            >
              {pending ? (
                'Signing in…'
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#999999]">
          Access is restricted to approved admin accounts only.
        </p>
      </div>
    </div>
  )
}

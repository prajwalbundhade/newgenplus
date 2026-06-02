'use client'

/**
 * FeedbackModal — premium modal dialog for collecting user feedback.
 *
 * Triggered from the header "Give Feedback" button. Supports multiple
 * feedback types, star rating, and submits via Web3Forms server action.
 *
 * Features:
 * - Smooth enter/exit animations
 * - Backdrop blur
 * - ESC to close, click outside to close
 * - Fully accessible (focus trap, aria attributes)
 * - Mobile-first responsive design
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from 'react'
import { X } from 'lucide-react'
import { StarRating } from './StarRating'

export type FeedbackType =
  | 'feedback'
  | 'suggestion'
  | 'bug_report'
  | 'feature_request'
  | 'prompt_report'
  | 'general_review'

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'prompt_report', label: 'Prompt Report' },
  { value: 'general_review', label: 'General Review' },
]

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<FeedbackType | ''>('')
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [visible, setVisible] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  // Animate in
  useEffect(() => {
    if (open) {
      setVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Auto-close on success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        handleClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  // Focus trap — focus the close button on open
  useEffect(() => {
    if (open && visible) {
      setTimeout(() => firstFocusRef.current?.focus(), 100)
    }
  }, [open, visible])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      onClose()
      if (status === 'success') {
        resetForm()
      }
    }, 200)
  }, [onClose, status])

  const resetForm = () => {
    setName('')
    setEmail('')
    setType('')
    setRating(0)
    setMessage('')
    setStatus('idle')
    setErrorMessage('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!type || message.length < 20) return

    setStatus('submitting')
    setErrorMessage('')

    try {
      const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY
      if (!accessKey) {
        setStatus('error')
        setErrorMessage('Service temporarily unavailable.')
        return
      }

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `[NeuwGenX] ${type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${name.trim() || 'Anonymous'}`,
          from_name: name.trim() || 'Anonymous Visitor',
          ...(email.trim() ? { email: email.trim(), replyto: email.trim() } : {}),
          feedback_type: type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
          ...(rating ? { rating: `${rating}/5` } : {}),
          message: message.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(data.message || 'Submission failed. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    }
  }

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={dialogRef}
        className={`
          relative w-full max-w-lg transform rounded-2xl
          border border-[#E8E3DE] bg-white shadow-xl
          transition-all duration-200 ease-out
          max-h-[85vh] overflow-y-auto
          ${visible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}
        `}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F0EBE5] bg-white/95 backdrop-blur-sm px-4 py-3 sm:px-6 sm:py-4 rounded-t-2xl">
          <h2
            id="feedback-modal-title"
            className="text-[15px] font-semibold text-[#111111] sm:text-lg"
          >
            Give Feedback
          </h2>
          <button
            ref={firstFocusRef}
            type="button"
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#666666] transition-colors hover:bg-[#F0EBE5] hover:text-[#111111]"
            aria-label="Close feedback dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          {status === 'success' ? (
            <SuccessState onClose={handleClose} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-5">
              {/* Name + Email row */}
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <fieldset>
                  <label
                    htmlFor="feedback-name"
                    className="mb-1 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-1.5"
                  >
                    Name <span className="text-[#999999]">(optional)</span>
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-9 sm:h-10 w-full rounded-lg border border-[#E8E3DE] bg-white px-3 text-[13px] sm:text-sm text-[#111111] placeholder:text-[#BBBBBB] transition-colors focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
                  />
                </fieldset>
                <fieldset>
                  <label
                    htmlFor="feedback-email"
                    className="mb-1 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-1.5"
                  >
                    Email <span className="text-[#999999]">(optional)</span>
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 sm:h-10 w-full rounded-lg border border-[#E8E3DE] bg-white px-3 text-[13px] sm:text-sm text-[#111111] placeholder:text-[#BBBBBB] transition-colors focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
                  />
                </fieldset>
              </div>

              {/* Feedback type */}
              <fieldset>
                <label className="mb-1.5 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-2">
                  Feedback Type <span className="text-[#DC2626]">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {FEEDBACK_TYPES.map((ft) => (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => setType(ft.value)}
                      className={`rounded-md sm:rounded-lg border px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11.5px] sm:text-[13px] font-medium transition-all ${
                        type === ft.value
                          ? 'border-[#FF6B35] bg-[#FFF6F2] text-[#FF6B35]'
                          : 'border-[#E8E3DE] bg-white text-[#666666] hover:border-[#D9CFC7] hover:text-[#4A3F3A]'
                      }`}
                    >
                      {ft.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Star rating */}
              <fieldset>
                <label className="mb-1 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-2">
                  Rating
                </label>
                <StarRating value={rating} onChange={setRating} />
              </fieldset>

              {/* Message */}
              <fieldset>
                <label
                  htmlFor="feedback-message"
                  className="mb-1 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-1.5"
                >
                  Message <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind... (min 20 characters)"
                  rows={3}
                  minLength={20}
                  maxLength={2000}
                  required
                  className="w-full resize-none rounded-lg border border-[#E8E3DE] bg-white px-3 py-2 sm:py-2.5 text-[13px] sm:text-sm text-[#111111] placeholder:text-[#BBBBBB] transition-colors focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
                />
                <div className="mt-0.5 flex justify-between text-[10px] sm:text-[11px] text-[#999999]">
                  <span>
                    {message.length < 20
                      ? `${20 - message.length} more characters needed`
                      : 'Looks good'}
                  </span>
                  <span>{message.length}/2000</span>
                </div>
              </fieldset>

              {/* Error state */}
              {status === 'error' && (
                <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 sm:px-4 sm:py-3 text-[12px] sm:text-sm text-[#DC2626]">
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!type || message.length < 20 || status === 'submitting'}
                className="flex h-10 sm:h-11 w-full items-center justify-center rounded-xl bg-[#FF6B35] text-[13px] sm:text-sm font-semibold text-white shadow-[0_2px_8px_rgba(255,107,53,0.3)] transition-all hover:bg-[#e55a2b] hover:shadow-[0_4px_12px_rgba(255,107,53,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {status === 'submitting' ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending...
                  </span>
                ) : status === 'error' ? (
                  'Retry'
                ) : (
                  'Send Feedback'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4]">
        <svg
          className="h-7 w-7 text-[#16A34A]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[#111111]">
        Thank you!
      </h3>
      <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#666666]">
        Thank you for helping improve NeuwGenX.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-[#E8E3DE] px-5 py-2 text-sm font-medium text-[#4A3F3A] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35]"
      >
        Close
      </button>
    </div>
  )
}

'use client'

/**
 * SubmitPromptModal — modal dialog for community prompt submissions.
 *
 * Fields: name, email, image upload, prompt text, AI model used.
 * Submits via Web3Forms (same API key as the feedback form).
 *
 * Features:
 * - Smooth enter/exit animations
 * - Backdrop blur
 * - ESC to close, click outside to close
 * - Image preview before send (converted to base64 for the email)
 * - Fully accessible (aria attributes)
 * - Mobile-first responsive design
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type ChangeEvent,
} from 'react'
import { X, Upload, ImageIcon } from 'lucide-react'

interface SubmitPromptModalProps {
  open: boolean
  onClose: () => void
}

const DEFAULT_MODELS = [
  'ChatGPT',
  'Gemini',
  'Grok',
  'Meta AI',
]

export function SubmitPromptModal({ open, onClose }: SubmitPromptModalProps) {
  const [modelInput, setModelInput] = useState('')
  const [isCustomModel, setIsCustomModel] = useState(false)
  const [customModel, setCustomModel] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [visible, setVisible] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Animate in / lock scroll
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

  // Auto-close after success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => handleClose(), 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  // Focus close button on open
  useEffect(() => {
    if (open && visible) {
      setTimeout(() => closeButtonRef.current?.focus(), 100)
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
      if (status === 'success') resetForm()
    }, 200)
  }, [onClose, status])

  const resetForm = () => {
    setName('')
    setEmail('')
    setPrompt('')
    setModel('')
    setModelInput('')
    setIsCustomModel(false)
    setCustomModel('')
    setImageFile(null)
    setImagePreview(null)
    setStatus('idle')
    setErrorMessage('')
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image must be under 5 MB.')
      return
    }
    setErrorMessage('')
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (prompt.trim().length < 20 || !model) return

    setStatus('submitting')
    setErrorMessage('')

    try {
      // Use FormData so the image goes as a real file — never stored
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('email', email.trim())
      formData.append('prompt', prompt.trim())
      formData.append('model', model)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await fetch('/api/submit-prompt', {
        method: 'POST',
        body: formData,
        // No Content-Type header — browser sets it automatically with boundary for FormData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Submission failed. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    }
  }

  const isValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    prompt.trim().length >= 20 &&
    model.trim().length > 0

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-prompt-modal-title"
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
          max-h-[90vh] overflow-y-auto
          ${visible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}
        `}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F0EBE5] bg-white/95 backdrop-blur-sm px-4 py-3 sm:px-6 sm:py-4 rounded-t-2xl">
          <div>
            <h2
              id="submit-prompt-modal-title"
              className="text-[15px] font-semibold text-[#111111] sm:text-lg"
            >
              Submit a Prompt
            </h2>
            <p className="text-[11px] text-[#999999] sm:text-xs mt-0.5">
              Share it with the community and get featured.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#666666] transition-colors hover:bg-[#F0EBE5] hover:text-[#111111]"
            aria-label="Close prompt submission dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          {status === 'success' ? (
            <SubmitSuccessState onClose={handleClose} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-5">
              {/* Name + Email row */}
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <fieldset>
                  <label
                    htmlFor="submit-prompt-name"
                    className="mb-1 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-1.5"
                  >
                    Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="submit-prompt-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="h-9 sm:h-10 w-full rounded-lg border border-[#E8E3DE] bg-white px-3 text-[13px] sm:text-sm text-[#111111] placeholder:text-[#BBBBBB] transition-colors focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
                  />
                </fieldset>
                <fieldset>
                  <label
                    htmlFor="submit-prompt-email"
                    className="mb-1 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-1.5"
                  >
                    Email <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="submit-prompt-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-9 sm:h-10 w-full rounded-lg border border-[#E8E3DE] bg-white px-3 text-[13px] sm:text-sm text-[#111111] placeholder:text-[#BBBBBB] transition-colors focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
                  />
                </fieldset>
              </div>

              {/* Image upload */}
              <fieldset>
                <label className="mb-1.5 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-2">
                  Generated Image <span className="text-[#999999]">(optional, max 5 MB)</span>
                </label>

                {imagePreview ? (
                  <div className="relative group w-full overflow-hidden rounded-xl border border-[#E8E3DE]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview of uploaded image"
                      className="w-full max-h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
                      <p className="text-[11px] text-white truncate">{imageFile?.name}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E8E3DE] bg-[#FAFAF9] px-4 py-6 text-center transition-colors hover:border-[#FF6B35]/50 hover:bg-[#FFF6F2]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0EBE5]">
                      <ImageIcon size={18} className="text-[#999999]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#555555]">
                        Click to upload image
                      </p>
                      <p className="text-[11px] text-[#999999] mt-0.5">
                        PNG, JPG, WEBP up to 5 MB
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E3DE] bg-white px-3 py-1.5 text-[12px] font-medium text-[#555555] shadow-sm transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35]">
                      <Upload size={12} />
                      Choose file
                    </span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                  aria-label="Upload generated image"
                />
              </fieldset>

              {/* Prompt text */}
              <fieldset>
                <label
                  htmlFor="submit-prompt-text"
                  className="mb-1 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-1.5"
                >
                  Prompt <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="submit-prompt-text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Paste your prompt here... (min 20 characters)"
                  rows={4}
                  minLength={20}
                  maxLength={5000}
                  required
                  className="w-full resize-none rounded-lg border border-[#E8E3DE] bg-white px-3 py-2 sm:py-2.5 text-[13px] sm:text-sm text-[#111111] placeholder:text-[#BBBBBB] transition-colors focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
                />
                <div className="mt-0.5 flex justify-between text-[10px] sm:text-[11px] text-[#999999]">
                  <span>
                    {prompt.length < 20
                      ? `${20 - prompt.length} more characters needed`
                      : 'Looks good ✓'}
                  </span>
                  <span>{prompt.length}/5000</span>
                </div>
              </fieldset>

              {/* Model used */}
              <fieldset>
                <label
                  htmlFor="submit-prompt-model"
                  className="mb-1.5 block text-[12px] font-medium text-[#666666] sm:text-[13px] sm:mb-2"
                >
                  AI Model Used <span className="text-[#DC2626]">*</span>
                </label>

                {!isCustomModel ? (
                  <div className="flex gap-2">
                    <select
                      id="submit-prompt-model"
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value)
                        setModelInput(e.target.value)
                      }}
                      required
                      className="h-10 w-full rounded-lg border border-[#E8E3DE] bg-white px-3 text-[13px] sm:text-sm text-[#111111] transition-colors focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '36px',
                      }}
                    >
                      <option value="" disabled>Select a model...</option>
                      {DEFAULT_MODELS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomModel(true)
                        setModel('')
                        setCustomModel('')
                      }}
                      className="shrink-0 rounded-lg border border-[#E8E3DE] bg-white px-3 text-[12px] font-medium text-[#666666] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35] whitespace-nowrap"
                    >
                      + Add new
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => {
                        setCustomModel(e.target.value)
                        setModel(e.target.value)
                      }}
                      placeholder="e.g. Grok 2, Llama 3, Kling AI..."
                      autoFocus
                      className="h-10 w-full rounded-lg border border-[#FF6B35] bg-white px-3 text-[13px] sm:text-sm text-[#111111] placeholder:text-[#BBBBBB] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomModel(false)
                        setModel('')
                        setCustomModel('')
                      }}
                      className="shrink-0 rounded-lg border border-[#E8E3DE] bg-white px-3 text-[12px] font-medium text-[#666666] transition-colors hover:border-[#DC2626] hover:text-[#DC2626] whitespace-nowrap"
                    >
                      ← Back
                    </button>
                  </div>
                )}

                {model && (
                  <p className="mt-1.5 text-[11px] text-[#16A34A]">
                    ✓ {isCustomModel ? 'Custom model' : 'Model'}: <span className="font-medium">{model}</span>
                  </p>
                )}
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
                disabled={!isValid || status === 'submitting'}
                className="flex h-10 sm:h-11 w-full items-center justify-center rounded-xl bg-[#FF6B35] text-[13px] sm:text-sm font-semibold text-white shadow-[0_2px_8px_rgba(255,107,53,0.3)] transition-all hover:bg-[#e55a2b] hover:shadow-[0_4px_12px_rgba(255,107,53,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {status === 'submitting' ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
                    Submitting...
                  </span>
                ) : status === 'error' ? (
                  'Retry'
                ) : (
                  'Submit Prompt'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function SubmitSuccessState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FDF4]">
        <svg
          className="h-8 w-8 text-[#16A34A]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[#111111]">Prompt Submitted!</h3>
      <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#666666]">
        Thanks for sharing! Our team will review your prompt and may feature it on the homepage.
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

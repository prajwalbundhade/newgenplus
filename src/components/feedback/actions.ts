'use server'

/**
 * Server action for submitting feedback via Web3Forms.
 *
 * The access key is a public form ID (safe for client exposure per Web3Forms docs),
 * but we keep submission server-side to prevent spam bots from easily
 * calling the endpoint directly.
 */

import type { FeedbackType } from './FeedbackModal'

interface FeedbackInput {
  name?: string
  email?: string
  type: FeedbackType
  rating?: number
  message: string
}

interface FeedbackResult {
  success: boolean
  error?: string
}

const TYPE_LABELS: Record<FeedbackType, string> = {
  feedback: 'Feedback',
  suggestion: 'Suggestion',
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  prompt_report: 'Prompt Report',
  general_review: 'General Review',
}

export async function submitFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY

  if (!accessKey) {
    console.error('[Feedback] NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY is not configured')
    return { success: false, error: 'Service temporarily unavailable. Please try again later.' }
  }

  // Validate on server side
  if (!input.type || !input.message || input.message.trim().length < 20) {
    return { success: false, error: 'Please provide a valid feedback type and message (minimum 20 characters).' }
  }

  if (input.message.trim().length > 2000) {
    return { success: false, error: 'Message exceeds maximum length of 2000 characters.' }
  }

  const payload = {
    access_key: accessKey,
    subject: `[NeuwGenX] ${TYPE_LABELS[input.type]} — ${input.name || 'Anonymous'}`,
    from_name: input.name || 'Anonymous Visitor',
    ...(input.email ? { email: input.email, replyto: input.email } : {}),
    feedback_type: TYPE_LABELS[input.type],
    ...(input.rating ? { rating: `${input.rating}/5` } : {}),
    message: input.message.trim(),
  }

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`[Feedback] Web3Forms responded with status ${response.status}`)
      return { success: false, error: 'Submission failed. Please try again.' }
    }

    const data = await response.json()

    if (data.success) {
      return { success: true }
    }

    console.error('[Feedback] Web3Forms error:', data.message)
    return {
      success: false,
      error: data.message || 'Submission failed. Please try again.',
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Feedback] Fetch error:', message)
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    }
  }
}

'use client'

/**
 * Anonymous session id.
 *
 * A stable per-browser-session identifier used to deduplicate view counts and
 * attribute analytics events without any PII or cookies. Stored in
 * sessionStorage so it resets per tab session.
 */

const KEY = 'ngp_sid'

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = window.sessionStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      window.sessionStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

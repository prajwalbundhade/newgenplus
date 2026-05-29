/**
 * Standard discriminated result for Server Actions.
 *
 * Per ARCHITECTURE §9.3: actions never throw across the boundary for expected
 * failures — they return a typed result the client can branch on.
 */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string>
): ActionResult<never> {
  return { ok: false, error, fieldErrors }
}

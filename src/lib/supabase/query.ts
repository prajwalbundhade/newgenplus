/**
 * Typed query wrappers.
 *
 * The @supabase/ssr `createServerClient<Database>` does not propagate the
 * Database generic into the query builder, so `.from('x').select(...)` resolves
 * its `data` to `never`. Rather than scatter `as` casts across every call site,
 * these helpers centralise the cast in ONE place and re-attach a caller-supplied
 * row type, giving fully-typed results everywhere downstream.
 *
 * Usage:
 *   const rows = await selectMany<ResourceRow>(
 *     supabase.from('resources').select('*').eq('status', 'published')
 *   )
 *
 * Two families:
 *   - selectMany / selectMaybeOne / selectOne  → throw on a real DB error
 *   - trySelectMany / trySelectMaybeOne        → never throw, return a fallback
 *     (use on the public read path where a transient error should degrade
 *      gracefully rather than crash the page)
 */

/** Minimal shape every Supabase query result satisfies. */
interface SupabaseResult<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

/** A PostgREST query builder is a thenable that resolves to a result. */
type Thenable<T> = PromiseLike<SupabaseResult<T>>

/**
 * Run a query expected to return multiple rows.
 * Returns `Row[]` (empty array when there is no data).
 * Throws if the query returns a database error.
 */
export async function selectMany<Row>(
  query: Thenable<unknown>
): Promise<Row[]> {
  const { data, error } = (await query) as SupabaseResult<Row[]>
  if (error) {
    throw new Error(`[selectMany] ${error.message}`)
  }
  return data ?? []
}

/**
 * Run a query expected to return zero or one row (e.g. `.maybeSingle()`).
 * Returns `Row | null`. Throws on a database error.
 */
export async function selectMaybeOne<Row>(
  query: Thenable<unknown>
): Promise<Row | null> {
  const { data, error } = (await query) as SupabaseResult<Row>
  if (error) {
    throw new Error(`[selectMaybeOne] ${error.message}`)
  }
  return data ?? null
}

/**
 * Run a query that must return exactly one row (e.g. `.single()`).
 * Returns `Row`. Throws if missing or on a database error.
 */
export async function selectOne<Row>(query: Thenable<unknown>): Promise<Row> {
  const { data, error } = (await query) as SupabaseResult<Row>
  if (error) {
    throw new Error(`[selectOne] ${error.message}`)
  }
  if (data === null) {
    throw new Error('[selectOne] expected one row, got none')
  }
  return data
}

/**
 * Non-throwing variant of selectMany for the public read path.
 * Logs and returns an empty array on error so a page degrades gracefully.
 */
export async function trySelectMany<Row>(
  query: Thenable<unknown>
): Promise<Row[]> {
  try {
    return await selectMany<Row>(query)
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Non-throwing variant of selectMaybeOne for the public read path.
 * Logs and returns null on error.
 */
export async function trySelectMaybeOne<Row>(
  query: Thenable<unknown>
): Promise<Row | null> {
  try {
    return await selectMaybeOne<Row>(query)
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    return null
  }
}

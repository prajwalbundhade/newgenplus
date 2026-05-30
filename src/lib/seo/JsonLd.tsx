/**
 * JsonLd — renders one or more schema.org objects as a single
 * `<script type="application/ld+json">` tag.
 *
 * Server Component (no 'use client'); the JSON is serialised at render time so
 * crawlers receive it in the initial HTML with zero client cost.
 *
 * Security: the payload is built entirely from our own builders over trusted
 * DB content, but we still escape `<` to defuse any `</script>` sequence that
 * could appear inside user-influenced fields (e.g. review bodies).
 */
import type { ReactElement } from 'react'

interface JsonLdProps {
  /** A single schema object or an array of them (rendered as a @graph-less list). */
  schema: Record<string, unknown> | Record<string, unknown>[]
  /** Optional stable id for the script tag (useful for tests / dedupe). */
  id?: string
}

function serialise(schema: JsonLdProps['schema']): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}

export function JsonLd({ schema, id }: JsonLdProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      id={id}
      // eslint-disable-next-line react/no-danger -- trusted, escaped JSON-LD payload
      dangerouslySetInnerHTML={{ __html: serialise(schema) }}
    />
  )
}

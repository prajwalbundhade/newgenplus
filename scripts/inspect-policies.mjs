/**
 * Inspects the live RLS policies and the actual stored row on admin_users.
 * Uses service-role (bypasses RLS) to read catalog + data. Read-only.
 * Usage: node scripts/inspect-policies.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = {}
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Read the raw stored row including the exact id bytes
const { data: rows } = await admin.from('admin_users').select('*')
console.log('=== admin_users rows (service-role) ===')
for (const r of rows ?? []) {
  console.log(JSON.stringify(r))
  console.log('id length:', r.id.length, '| id char codes tail:', [...r.id.slice(-4)].map(c => c.charCodeAt(0)))
}

// Inspect policies via a SECURITY DEFINER-free catalog query through PostgREST is not possible,
// so use the SQL endpoint via rpc if available; otherwise print guidance.
console.log('\n(If you need the live policy text, run the SQL in inspect-policies.sql in the Supabase SQL editor.)')

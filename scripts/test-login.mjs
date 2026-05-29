/**
 * Read-only login reproduction.
 * Mimics exactly what loginWithPassword() does:
 *   1. signInWithPassword (anon client, like the server client)
 *   2. allowlist lookup by the returned user id (service-role client)
 * Prints the real failure point. No writes.
 *
 * Usage: node scripts/test-login.mjs "<password>"
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = {}
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}

const EMAIL = 'newgenstudiosbiz@gmail.com'
const PASSWORD = process.argv[2]

if (!PASSWORD) {
  console.error('Pass the password as an argument: node scripts/test-login.mjs "yourpassword"')
  process.exit(1)
}

console.log('\n=== login reproduction ===\n')
console.log('SUPABASE_URL present:', Boolean(env.NEXT_PUBLIC_SUPABASE_URL))
console.log('ANON_KEY present:    ', Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
console.log('SERVICE_KEY present: ', Boolean(env.SUPABASE_SERVICE_ROLE_KEY))
console.log('ANON_KEY prefix:     ', (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').slice(0, 12))

// Step 1 — sign in with the ANON key (this is what the server client uses)
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
})

console.log('\n--- Step 1: signInWithPassword (anon key) ---')
if (signInError) {
  console.log('❌ sign-in FAILED:', signInError.status, signInError.message)
  console.log('   → This is your login failure. Cause is credentials/auth config, NOT the allowlist.')
  process.exit(0)
}
console.log('✅ sign-in OK. user id:', signInData.user?.id)

// Step 2 — allowlist lookup with service-role (what the fixed action does)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: row, error: rowError } = await admin
  .from('admin_users')
  .select('id,email,role')
  .eq('id', signInData.user.id)
  .single()

console.log('\n--- Step 2: allowlist lookup (service-role) ---')
if (rowError) {
  console.log('❌ allowlist query error:', rowError.message)
} else if (!row) {
  console.log('❌ no admin_users row for this id')
} else {
  console.log('✅ allowlist OK:', row)
}

console.log('\n--- VERDICT ---')
if (!signInError && row) {
  console.log('✅ Both steps pass. Login SHOULD succeed in the app.')
  console.log('   If the browser still fails, the issue is cookie persistence on the')
  console.log('   server-action response, not credentials or the allowlist.')
}
console.log('')

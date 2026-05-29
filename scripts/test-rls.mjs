/**
 * Reproduces getAdminSession()'s ACTUAL query path:
 * an anon client carrying the user's session JWT, reading admin_users
 * under RLS `USING (id = auth.uid())`.
 *
 * Usage: node scripts/test-rls.mjs "<password>"
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
if (!PASSWORD) { console.error('Pass the password as an argument'); process.exit(1) }

// 1. Sign in to obtain a session JWT
const signer = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { data: s, error: signErr } = await signer.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
if (signErr) { console.log('sign-in failed:', signErr.message); process.exit(0) }

const accessToken = s.session.access_token
console.log('✅ got session JWT for user', s.user.id)

// 2. Build an ANON client that carries the user's JWT — this is what the
//    @supabase/ssr server client effectively does on an authenticated request.
const userClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${accessToken}` } },
  auth: { autoRefreshToken: false, persistSession: false },
})

// 3. Run the EXACT query getAdminSession() runs, under RLS
const { data, error } = await userClient
  .from('admin_users')
  .select('id,email,role')
  .eq('id', s.user.id)
  .single()

console.log('\n--- admin_users read under RLS (anon client + user JWT) ---')
if (error) {
  console.log('❌ RLS query ERROR:', error.code, error.message)
  console.log('   → This is why getAdminSession() returns null in the app.')
} else if (!data) {
  console.log('❌ RLS returned NO ROW (policy blocked the self-read).')
  console.log('   → This is why getAdminSession() returns null in the app.')
} else {
  console.log('✅ RLS allowed the read:', data)
  console.log('   → getAdminSession() should work; the problem is cookie persistence instead.')
}
console.log('')

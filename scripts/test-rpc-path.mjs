/**
 * Verifies the NEW getAdminSession() path: is_admin() + is_super_admin() RPCs
 * under the user's JWT (anon client). Usage: node scripts/test-rpc-path.mjs "<password>"
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
if (!PASSWORD) { console.error('Pass the password'); process.exit(1) }

const signer = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { data: s, error } = await signer.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
if (error) { console.log('sign-in failed:', error.message); process.exit(0) }

const userClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${s.session.access_token}` } },
  auth: { autoRefreshToken: false, persistSession: false },
})

const [a, sup] = await Promise.all([userClient.rpc('is_admin'), userClient.rpc('is_super_admin')])
console.log('is_admin:', a.data, a.error?.message ?? '')
console.log('is_super_admin:', sup.data, sup.error?.message ?? '')
console.log('\nResulting session would be:', a.data === true ? {
  userId: s.user.id, email: s.user.email, role: sup.data === true ? 'super_admin' : 'admin',
} : 'null (REJECTED)')

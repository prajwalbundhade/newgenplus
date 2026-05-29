/**
 * Determines whether auth.uid() resolves under the user's JWT.
 * Usage: node scripts/test-auth-uid.mjs "<password>"
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

const signer = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { data: s, error: signErr } = await signer.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
if (signErr) { console.log('sign-in failed:', signErr.message); process.exit(0) }

const token = s.session.access_token
console.log('user id (from session):', s.user.id)

// Decode JWT payload to inspect claims (no verification, just base64 decode)
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'))
console.log('\n--- JWT claims ---')
console.log('sub:  ', payload.sub)
console.log('role: ', payload.role)
console.log('aud:  ', payload.aud)
console.log('iss:  ', payload.iss)
console.log('alg (header):', JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString('utf8')).alg)

const userClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${token}` } },
  auth: { autoRefreshToken: false, persistSession: false },
})

// Test 1: does is_admin() RPC see auth.uid()?
const { data: isAdmin, error: rpcErr } = await userClient.rpc('is_admin')
console.log('\n--- rpc is_admin() under user JWT ---')
if (rpcErr) console.log('❌ rpc error:', rpcErr.code, rpcErr.message)
else console.log('is_admin() =', isAdmin, isAdmin === true ? '(auth.uid() RESOLVES ✅)' : '(auth.uid() likely NULL ❌)')

// Test 2: select admin_users WITHOUT .single — how many rows are visible?
const { data: rows, error: selErr } = await userClient.from('admin_users').select('id,email,role')
console.log('\n--- select admin_users (no single) under RLS ---')
if (selErr) console.log('❌ select error:', selErr.code, selErr.message)
else console.log('visible rows:', rows.length, rows)

console.log('')

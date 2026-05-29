import type { NextConfig } from 'next'
import { supabaseHostname } from './src/config/env'

const nextConfig: NextConfig = {
  experimental: {
    // Enables forbidden() and unauthorized() APIs for role-based interrupts
    authInterrupts: true,
  },
  images: {
    // Allow next/image to optimize images served from Supabase Storage.
    // Hostname is derived from NEXT_PUBLIC_SUPABASE_URL (validated in env.ts).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig

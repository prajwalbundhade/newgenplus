import type { NextConfig } from 'next'
import { supabaseHostname } from './src/config/env'

const nextConfig: NextConfig = {
  experimental: {
    // Enables forbidden() and unauthorized() APIs for role-based interrupts
    authInterrupts: true,
    // Allow Server Action payloads up to 5 MB so cover-image uploads (capped at
    // 3 MB client-side) fit after multipart encoding overhead. The default is
    // 1 MB, which caused 400s for images over ~1 MB.
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  images: {
    // Allow next/image to optimize images served from Supabase Storage.
    unoptimized: true,
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

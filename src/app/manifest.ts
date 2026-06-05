/**
 * Web App Manifest served at /manifest.webmanifest.
 */
import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} - ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FFF9F5',
    theme_color: '#FF6B35',
    categories: ['productivity', 'education', 'graphics'],
    shortcuts: [
      {
        name: 'Search prompts',
        short_name: 'Search',
        description: `Search ${siteConfig.name} prompts.`,
        url: '/search',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    ],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  }
}

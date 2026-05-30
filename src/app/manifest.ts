/**
 * Web App Manifest — served at /manifest.webmanifest.
 *
 * Enables installable PWA basics and gives Android/Chrome rich icons + theme
 * colour. Built from `siteConfig` so brand strings stay single-sourced.
 */
import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF9F5',
    theme_color: '#FF6B35',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}

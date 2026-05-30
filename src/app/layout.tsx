import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { siteConfig } from '@/config/site'
import { verification } from '@/config/seo'
import { JsonLd } from '@/lib/seo/JsonLd'
import { organizationSchema, webSiteSchema } from '@/lib/seo/schema'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  // Lets Next resolve relative OG/canonical against the production origin.
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  // Icons are provided via file conventions: app/favicon.ico, app/icon.svg,
  // and app/apple-icon.tsx — Next auto-injects the corresponding <link> tags.
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: siteConfig.locale,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    site: `@${siteConfig.twitter}`,
    creator: `@${siteConfig.twitter}`,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // Verification meta tags. Empty values are omitted by Next automatically.
  verification: {
    ...(verification.google ? { google: verification.google } : {}),
    ...(verification.yandex ? { yandex: verification.yandex } : {}),
    ...(verification.bing ? { other: { 'msvalidate.01': verification.bing } } : {}),
  },
}

export const viewport: Viewport = {
  themeColor: '#FF6B35',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Site-wide structured data (Organization + WebSite/SearchAction). */}
        <JsonLd id="ld-organization" schema={organizationSchema()} />
        <JsonLd id="ld-website" schema={webSiteSchema()} />
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  )
}

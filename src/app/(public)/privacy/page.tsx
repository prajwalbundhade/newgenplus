/**
 * Privacy Policy page — /privacy
 *
 * Static legal page outlining data collection, usage, and user rights.
 */

import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { buildMetadata } from '@/lib/seo/metadata'
import { routes } from '@/config/routes'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description: `Read the ${siteConfig.name} Privacy Policy. Learn how we collect, use, and protect your information.`,
  path: routes.privacy,
  keywords: ['privacy policy', 'data protection', 'user privacy', 'cookies'],
})

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
      {/* Page header */}
      <header className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35] shadow-[0_3px_12px_rgba(255,107,53,0.3)]">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#13100E] sm:text-3xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-[#7A6F69]">Last Updated: June 2026</p>
      </header>

      {/* Content */}
      <div className="space-y-8 text-[15px] leading-relaxed text-[#4A3F3A] sm:text-base sm:leading-[1.75]">
        <p>
          At {siteConfig.name}, we respect your privacy and are committed to
          protecting your personal information.
        </p>

        {/* Information We Collect */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Information We Collect
          </h2>
          <p className="mb-2">We may collect:</p>
          <ul className="space-y-1.5 pl-5">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Name (when submitting reviews)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Email address (when submitting reviews or contacting us)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Usage analytics
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Device and browser information
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Search queries used on our platform
            </li>
          </ul>
        </section>

        {/* How We Use Information */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            How We Use Information
          </h2>
          <p className="mb-2">We use collected information to:</p>
          <ul className="space-y-1.5 pl-5">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Improve our platform
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Moderate reviews
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Analyze website performance
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Understand user behavior
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Prevent abuse and spam
            </li>
          </ul>
        </section>

        {/* Analytics */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Analytics
          </h2>
          <p>
            We use analytics tools such as Google Analytics to understand how
            visitors interact with our website.
          </p>
          <p className="mb-2 mt-3">These tools may collect:</p>
          <ul className="space-y-1.5 pl-5">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              IP address
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Browser information
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Device information
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Pages visited
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Session duration
            </li>
          </ul>
        </section>

        {/* Cookies */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Cookies
          </h2>
          <p>
            {siteConfig.name} may use cookies and similar technologies to
            improve user experience and website functionality.
          </p>
        </section>

        {/* Data Sharing */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Data Sharing
          </h2>
          <p>We do not sell personal information.</p>
          <p>
            We may share limited information with trusted service providers that
            help operate our platform.
          </p>
        </section>

        {/* Security */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Security
          </h2>
          <p>
            We take reasonable measures to protect user data; however, no
            internet transmission or storage system can be guaranteed to be 100%
            secure.
          </p>
        </section>

        {/* Third-Party Services */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Third-Party Services
          </h2>
          <p>
            Our website may contain links to third-party websites and services.
            We are not responsible for their privacy practices.
          </p>
        </section>

        {/* Changes */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Changes
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Updated
            versions will be posted on this page.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Contact
          </h2>
          <p>For privacy-related inquiries, contact:</p>
          <p className="mt-1">
            <a
              href="mailto:newgenstudiosbiz@gmail.com"
              className="font-medium text-[#FF6B35] underline decoration-[#FF6B35]/30 underline-offset-2 transition-colors hover:text-[#e55a2b]"
            >
              newgenstudiosbiz@gmail.com
            </a>
          </p>
        </section>
      </div>
    </article>
  )
}

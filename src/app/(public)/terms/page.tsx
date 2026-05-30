/**
 * Terms of Service page — /terms
 *
 * Static legal page outlining usage rules, intellectual property,
 * disclaimers, and liability limitations.
 */

import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { buildMetadata } from '@/lib/seo/metadata'
import { routes } from '@/config/routes'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service',
  description: `Read the ${siteConfig.name} Terms of Service. Understand the rules and guidelines for using our platform.`,
  path: routes.terms,
  keywords: ['terms of service', 'terms and conditions', 'usage policy'],
})

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
      {/* Page header */}
      <header className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35] shadow-[0_3px_12px_rgba(255,107,53,0.3)]">
          <FileText size={20} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#13100E] sm:text-3xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-[#7A6F69]">Last Updated: June 2026</p>
      </header>

      {/* Content */}
      <div className="space-y-8 text-[15px] leading-relaxed text-[#4A3F3A] sm:text-base sm:leading-[1.75]">
        <p>
          By accessing or using {siteConfig.name}, you agree to these Terms of
          Service.
        </p>

        {/* Use of Content */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Use of Content
          </h2>
          <p>
            {siteConfig.name} provides AI prompts for informational and creative
            purposes.
          </p>

          <p className="mb-2 mt-4 font-medium text-[#13100E]">Users may:</p>
          <ul className="space-y-1.5 pl-5">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Browse prompts
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Copy prompts
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Use prompts in supported AI tools
            </li>
          </ul>

          <p className="mb-2 mt-4 font-medium text-[#13100E]">
            Users may not:
          </p>
          <ul className="space-y-1.5 pl-5">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Attempt to disrupt platform operations
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Scrape content at scale without permission
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Misrepresent ownership of {siteConfig.name} content
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Use the platform for unlawful activities
            </li>
          </ul>
        </section>

        {/* User Reviews */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            User Reviews
          </h2>
          <p>Users may submit reviews and feedback.</p>
          <p className="mb-2 mt-3">
            We reserve the right to moderate, edit, reject, or remove reviews
            that:
          </p>
          <ul className="space-y-1.5 pl-5">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Contain spam
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Contain abusive language
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Violate laws or regulations
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
              Mislead users
            </li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Intellectual Property
          </h2>
          <p>
            The {siteConfig.name} brand, website design, and platform content
            are protected by applicable intellectual property laws.
          </p>
          <p>
            Prompt ownership may belong to their respective creators where
            applicable.
          </p>
        </section>

        {/* Availability */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Availability
          </h2>
          <p>
            We strive to maintain platform availability but do not guarantee
            uninterrupted access.
          </p>
          <p>
            Features may change, be updated, or removed without notice.
          </p>
        </section>

        {/* Disclaimer */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Disclaimer
          </h2>
          <p>
            All prompts are provided &ldquo;as is&rdquo; without warranties of
            any kind.
          </p>
          <p>Results generated by AI models may vary.</p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Limitation of Liability
          </h2>
          <p>
            {siteConfig.name} shall not be liable for any indirect, incidental,
            or consequential damages resulting from the use of the platform.
          </p>
        </section>

        {/* Changes to Terms */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Changes to Terms
          </h2>
          <p>
            We may update these Terms periodically. Continued use of the
            platform constitutes acceptance of revised terms.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Contact
          </h2>
          <p>For questions regarding these Terms:</p>
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

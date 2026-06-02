/**
 * Contact page — /contact
 *
 * Provides users with contact information, a prominent email with copy
 * functionality, FAQ section, and expected response times.
 */

import type { Metadata } from 'next'
import { Mail, Clock, MessageCircle, HelpCircle } from 'lucide-react'
import { buildMetadata } from '@/lib/seo/metadata'
import { routes } from '@/config/routes'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/lib/seo/JsonLd'
import { CopyEmailButton } from '@/components/contact/CopyEmailButton'

const CONTACT_EMAIL = 'newgenstudiosbiz@gmail.com'

export const metadata: Metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'Contact NeuwGenX for support, partnerships, feedback, prompt submissions, and business inquiries.',
  path: routes.contact,
  keywords: [
    'contact',
    'support',
    'partnerships',
    'feedback',
    'prompt submissions',
  ],
})

const contactReasons = [
  'General inquiries',
  'Prompt submissions',
  'Partnership opportunities',
  'Feedback and suggestions',
  'Copyright concerns',
  'Technical issues',
]

const faqs = [
  {
    question: 'How do I submit a prompt?',
    answer:
      'Send your prompt along with the AI model used and a brief description to the given form. Our team will review it and, if approved, publish it on the platform.',
  },
  {
    question: 'Can I request a prompt to be removed?',
    answer:
      'Yes. If you believe a prompt infringes on your copyright or violates our terms, reach out with details and we will investigate promptly.',
  },
  {
    question: 'Do you offer partnerships or sponsorships?',
    answer:
      'We are open to collaborations with creators, AI tool providers, and brands aligned with our mission. Send us a message outlining your proposal.',
  },
  {
    question: 'Is there a cost to use NeuwGenX?',
    answer:
      'NeuwGenX is completely free to browse and use. No account is required to discover and copy prompts.',
  },
]

function contactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${siteConfig.url}/contact#contactpage`,
    name: `Contact ${siteConfig.name}`,
    description:
      'Contact NeuwGenX for support, partnerships, feedback, prompt submissions, and business inquiries.',
    url: `${siteConfig.url}/contact`,
    mainEntity: {
      '@type': 'Organization',
      '@id': `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      email: CONTACT_EMAIL,
      contactPoint: {
        '@type': 'ContactPoint',
        email: CONTACT_EMAIL,
        contactType: 'customer support',
        availableLanguage: 'English',
      },
    },
  }
}

export default function ContactPage() {
  return (
    <>
      <JsonLd id="ld-contact-page" schema={contactPageSchema()} />

      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        {/* Page header */}
        <header className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35] shadow-[0_3px_12px_rgba(255,107,53,0.3)]">
            <MessageCircle size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#13100E] sm:text-3xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#7A6F69]">
            Have a question, idea, or partnership proposal? We&rsquo;d love to
            hear from you.
          </p>
        </header>

        {/* Content */}
        <div className="space-y-10 text-[15px] leading-relaxed text-[#4A3F3A] sm:text-base sm:leading-[1.75]">
          {/* Email card */}
          <section className="rounded-2xl border border-[#E8E3DE] bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF6F2]">
              <Mail size={18} className="text-[#FF6B35]" />
            </div>
            <p className="mb-1 text-sm font-medium text-[#7A6F69]">
              Email us at
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-lg font-semibold text-[#FF6B35] underline decoration-[#FF6B35]/30 underline-offset-2 transition-colors hover:text-[#e55a2b] sm:text-xl"
            >
              {CONTACT_EMAIL}
            </a>
            <div className="mt-4">
              <CopyEmailButton email={CONTACT_EMAIL} />
            </div>
          </section>

          {/* What you can contact us about */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-[#13100E] sm:text-xl">
              What you can contact us about
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {contactReasons.map((reason) => (
                <li key={reason} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
                  {reason}
                </li>
              ))}
            </ul>
          </section>

          {/* Response time */}
          <section className="rounded-2xl border border-[#E8E3DE] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF6F2]">
                <Clock size={16} className="text-[#FF6B35]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#13100E] sm:text-lg">
                  Expected Response Time
                </h2>
                <p className="mt-1 text-[#4A3F3A]">
                  We typically respond within <strong>24–48 hours</strong> on
                  business days. During busy periods, it may take slightly
                  longer. We appreciate your patience.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <div className="mb-5 flex items-center gap-2">
              <HelpCircle size={18} className="text-[#FF6B35]" />
              <h2 className="text-lg font-semibold text-[#13100E] sm:text-xl">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-[#E8E3DE] bg-white p-5 shadow-sm"
                >
                  <h3 className="mb-2 text-[15px] font-semibold text-[#13100E] sm:text-base">
                    {faq.question}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#4A3F3A] sm:text-[15px]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>
    </>
  )
}

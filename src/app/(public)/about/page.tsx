/**
 * About page — /about
 *
 * Static informational page describing NewGenPlus, its mission,
 * supported platforms, and goals.
 */

import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { buildMetadata } from '@/lib/seo/metadata'
import { routes } from '@/config/routes'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = buildMetadata({
  title: 'About',
  description:
    'Learn about NewGenPlus — a curated library of high-quality AI prompts designed to help creators, designers, marketers, developers, and AI enthusiasts discover better prompts and create better results.',
  path: routes.about,
  keywords: [
    'about NewGenPlus',
    'AI prompt library',
    'prompt discovery platform',
    'AI tools',
  ],
})

const supportedPlatforms = [
  'GPT Image',
  'Nano Banana',
  'Grok Image',
  'Meta AI',
  'DALL·E',
  'And more',
]

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
      {/* Page header */}
      <header className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35] shadow-[0_3px_12px_rgba(255,107,53,0.3)]">
          <Sparkles size={20} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#13100E] sm:text-3xl">
          About {siteConfig.name}
        </h1>
      </header>

      {/* Content */}
      <div className="prose-newgen space-y-6 text-[15px] leading-relaxed text-[#4A3F3A] sm:text-base sm:leading-[1.75]">
        <p>
          {siteConfig.name} is a curated library of high-quality AI prompts
          designed to help creators, designers, marketers, developers, and AI
          enthusiasts discover better prompts and create better results.
        </p>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Our mission is simple
          </h2>
          <p className="font-medium text-[#13100E]">
            Make AI prompting easier, faster, and more accessible.
          </p>
          <p>
            Instead of spending hours experimenting with prompts, users can
            explore proven prompts, learn from successful examples, and instantly
            copy prompts for their favorite AI tools.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            We focus on quality over quantity
          </h2>
          <p>
            Every prompt published on {siteConfig.name} is reviewed,
            categorized, and associated with the appropriate AI model to make
            discovery simple and efficient.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Supported platforms include
          </h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {supportedPlatforms.map((platform) => (
              <li
                key={platform}
                className="flex items-center gap-2 text-[#4A3F3A]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
                {platform}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#13100E] sm:text-xl">
            Our goal
          </h2>
          <p>
            Our goal is to build the most useful prompt discovery platform for
            creators worldwide.
          </p>
          <p>
            Whether you&rsquo;re creating images, videos, websites, designs,
            marketing campaigns, or future AI-powered content, {siteConfig.name}{' '}
            aims to become your go-to resource.
          </p>
        </section>

        <p className="pt-4 text-center font-medium text-[#13100E]">
          Thank you for being part of the journey.
        </p>
      </div>
    </article>
  )
}

'use client'

import Link from 'next/link'
import { Camera, Sparkles, SendHorizontal, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const BANNERS = [
    {
        id: 'about',
        icon: <Sparkles size={20} />,
        eyebrow: 'What is this?',
        heading: 'The best AI prompts, curated.',
        body: 'Discover, copy and share prompts that actually work — for ChatGPT, Claude, Gemini and more.',
        cta: { label: 'Learn more', href: '/about' },
        theme: 'dark',
    },
    {
        id: 'instagram',
        icon: <Camera size={20} />,
        eyebrow: 'Community',
        heading: 'Follow us on Instagram',
        body: 'Daily prompt inspiration, tips and behind-the-scenes on our IG channel. Join 10k+ followers.',
        cta: { label: 'Follow @neuwgen_x', href: 'https://www.instagram.com/neuwgen_x/', external: true },
        theme: 'warm',
    },
    {
        id: 'submit',
        icon: <SendHorizontal size={20} />,
        eyebrow: 'Contribute',
        heading: 'Submit your best prompt',
        body: 'Got a prompt that slaps? Share it with the community and get featured on the homepage.',
        cta: { label: 'Submit a prompt', href: '/submit' },
        theme: 'white',
    },
] as const

const themes = {
    dark: {
        wrapper: 'bg-black text-white',
        eyebrow: 'text-white/50',
        body: 'text-white/70',
        icon: 'bg-white/10 text-white',
        cta: 'bg-white text-black hover:bg-[#F5F0EB]',
        border: 'border-transparent',
    },
    warm: {
        wrapper: 'bg-[#FF6B35] text-white',
        eyebrow: 'text-white/60',
        body: 'text-white/80',
        icon: 'bg-white/20 text-white',
        cta: 'bg-white text-[#FF6B35] hover:bg-[#FFF4EF]',
        border: 'border-transparent',
    },
    white: {
        wrapper: 'bg-[#F5F0EB] text-black',  // warm cream instead of pure white
        eyebrow: 'text-[#999]',
        body: 'text-[#555]',
        icon: 'bg-white text-black',           // icon bg flipped to white for contrast
        cta: 'bg-black text-white hover:bg-[#222]',
        border: 'border-[#E8E3DE]',
    },
}

function BannerCard({ card }: { card: typeof BANNERS[number] }) {
    const t = themes[card.theme]

    const content = (
        <div
            className={cn(
                'group relative flex w-[78vw] shrink-0 snap-start flex-col justify-between gap-4 rounded-xl border p-5 transition-transform duration-200 hover:-translate-y-0.5 sm:w-[55vw] lg:w-auto',
                t.wrapper,
                t.border
            )}
            style={{ minHeight: '190px' }}
        >
            {/* Top: icon + eyebrow */}
            <div className="flex items-start justify-between">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', t.icon)}>
                    {card.icon}
                </div>
                {card.eyebrow && (
                    <span className={cn('text-[11px] font-semibold uppercase tracking-widest', t.eyebrow)}>
                        {card.eyebrow}
                    </span>
                )}
            </div>

            {/* Middle: heading + body */}
            <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-bold leading-snug">{card.heading}</h3>
                <p className={cn('text-sm leading-relaxed', t.body)}>{card.body}</p>
            </div>

            {/* CTA */}
            <div>
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                        t.cta
                    )}
                >
                    {card.cta.label}
                    <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
            </div>
        </div>
    )

    return (card.cta as any).external ? (
        <a href={card.cta.href} target="_blank" rel="noopener noreferrer" className="contents">
            {content}
        </a>
    ) : (
        <Link href={card.cta.href} className="contents">
            {content}
        </Link>
    )
}

export function PromoBanners() {
    return (
        <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible lg:snap-none">
            {BANNERS.map((card) => (
                <BannerCard key={card.id} card={card} />
            ))}
        </div>
    )
}
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Camera, Sparkles, SendHorizontal, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubmitPromptModal } from './SubmitPromptModal'

const BANNERS = [
    {
        id: 'about',
        icon: <Sparkles size={16} />,
        eyebrow: 'What is this?',
        heading: 'The best AI prompts, curated.',
        body: 'Discover, copy and share prompts that actually work — for ChatGPT, Claude, Gemini and more.',
        cta: { label: 'Learn more', href: '/about' },
        theme: 'dark',
    },
    {
        id: 'instagram',
        icon: <Camera size={16} />,
        eyebrow: 'Community',
        heading: 'Follow us on Instagram',
        body: 'Daily prompt inspiration, tips and behind-the-scenes on our IG channel. Join 10k+ followers.',
        cta: { label: 'Follow @neuwgen_x', href: 'https://www.instagram.com/neuwgen_x/', external: true },
        theme: 'warm',
    },
    {
        id: 'submit',
        icon: <SendHorizontal size={16} />,
        eyebrow: 'Contribute',
        heading: 'Submit your best prompt',
        body: 'Got a prompt that slaps? Share it with the community and get featured on the homepage.',
        cta: { label: 'Submit a prompt', modal: true },
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
        wrapper: 'bg-[#F5F0EB] text-black',
        eyebrow: 'text-[#999]',
        body: 'text-[#555]',
        icon: 'bg-white text-black',
        cta: 'bg-black text-white hover:bg-[#222]',
        border: 'border-[#E8E3DE]',
    },
}

type BannerCard = typeof BANNERS[number]

function BannerCardContent({
    card,
    onSubmitClick,
}: {
    card: BannerCard
    onSubmitClick: () => void
}) {
    const t = themes[card.theme]
    const cta = card.cta as { label: string; modal?: boolean; href?: string; external?: boolean }

    const cardDiv = (
        <div
            className={cn(
                'group relative flex w-[72vw] shrink-0 snap-start flex-col justify-between gap-2 rounded-xl border p-3 sm:w-[55vw] sm:gap-4 sm:p-5 lg:w-auto transition-transform duration-200 hover:-translate-y-0.5',
                cta.modal && 'cursor-pointer',
                t.wrapper,
                t.border
            )}
            onClick={cta.modal ? onSubmitClick : undefined}
        >
            {/* Top: icon + eyebrow */}
            <div className="flex items-start justify-between">
                <div className={cn('flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg', t.icon)}>
                    {card.icon}
                </div>
                {card.eyebrow && (
                    <span className={cn('text-[9px] sm:text-[11px] font-semibold uppercase tracking-widest', t.eyebrow)}>
                        {card.eyebrow}
                    </span>
                )}
            </div>

            {/* Middle: heading + body */}
            <div className="flex flex-col gap-1">
                <h3 className="text-xs sm:text-base font-bold leading-snug">{card.heading}</h3>
                <p className={cn('text-[11px] sm:text-sm leading-relaxed', t.body)}>{card.body}</p>
            </div>

            {/* CTA */}
            <div>
                <span
                    className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-sm font-semibold transition-colors',
                        t.cta
                    )}
                >
                    {cta.label}
                    <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
            </div>
        </div>
    )

    if (cta.modal) {
        return cardDiv
    }

    if (cta.external) {
        return (
            <a href={cta.href} target="_blank" rel="noopener noreferrer" className="contents">
                {cardDiv}
            </a>
        )
    }

    return (
        <Link href={cta.href!} className="contents">
            {cardDiv}
        </Link>
    )
}

export function PromoBanners() {
    const [submitOpen, setSubmitOpen] = useState(false)

    return (
        <>
            <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 sm:gap-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:snap-none">
                {BANNERS.map((card) => (
                    <BannerCardContent
                        key={card.id}
                        card={card}
                        onSubmitClick={() => setSubmitOpen(true)}
                    />
                ))}
            </div>

            <SubmitPromptModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
        </>
    )
}
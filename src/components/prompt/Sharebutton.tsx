'use client'

import { useState } from 'react'
import { routes } from '@/config/routes'

interface ShareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    slug: string
    title?: string
    imageUrl?: string
}

export function ShareButton({ slug, title, imageUrl, children, className, ...props }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    async function handleClick() {
        const url = `${window.location.origin}${routes.prompt(slug)}`

        // Use native share sheet if available (mobile + modern desktop)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title ?? 'Check out this prompt',
                    text: 'Found this amazing AI prompt!',
                    url,
                })
                return
            } catch (err) {
                // User cancelled or share failed — fall through to clipboard
                if ((err as DOMException).name === 'AbortError') return
            }
        }

        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).catch(() => { })
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={handleClick}
                className={className}
                title="Share prompt"
                {...props}
            >
                {children}
            </button>

            {copied && (
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111111] px-2 py-1 text-[11px] text-white">
                    Link copied!
                </span>
            )}
        </div>
    )
}
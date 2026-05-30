'use client'

import { useEffect, useState } from 'react'

export function HeaderWrapper({ children }: { children: React.ReactNode }) {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    return (
        <header className="sticky top-0 z-40 px-4 py-3 sm:px-6 lg:px-8">
            <div
                className={`
          mx-auto flex h-[62px] w-full max-w-7xl items-center gap-4
          rounded-[14px] px-6 transition-all duration-300
          border border-[#E5D8CF]
          shadow-[0_2px_10px_rgba(0,0,0,0.04)]
          ${scrolled
                        ? 'bg-white/60 backdrop-blur-xl border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
                        : 'bg-white'
                    }
        `}
            >
                {children}
            </div>
        </header>
    )
}
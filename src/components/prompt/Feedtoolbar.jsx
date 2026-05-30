'use client'

/**
 * FeedToolbar
 *
 * A single horizontal bar above the prompt grid:
 *   LEFT  → "All" chip + top-4 AI model chips with logos
 *   RIGHT → Featured / Newest / Popular sort tabs
 *
 * Desktop only (hidden on mobile — mobile uses the bottom-sheet FilterSidebar).
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const SORTS = [
    { key: 'recent', label: 'Featured' },
    { key: 'trending', label: 'Newest' },
    { key: 'top', label: 'Popular' },
]

/**
 * topModels — pass the top 4 models (by prompt count) from the server.
 * Each: { id, name, slug, logoUrl? }
 */
export function FeedToolbar({ topModels = [], activeModel, activeSort, }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function setParam(key, value) {
        const params = new URLSearchParams(searchParams.toString())
        if (value === null) params.delete(key)
        else params.set(key, value)
        const qs = params.toString()
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }

    return (
        <div className="hidden lg:flex items-center justify-between gap-4 mb-5">

            {/* ── LEFT: All + model chips ─────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">

                {/* All chip */}
                <button
                    type="button"
                    onClick={() => setParam('model', null)}
                    className={cn(
                        'h-8 px-3.5 rounded-full border text-sm font-medium transition-colors',
                        !activeModel
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-[#333] border-[#E8E3DE] hover:border-[#999]'
                    )}
                >
                    All
                </button>

                {/* Top model chips */}
                {topModels.slice(0, 4).map((model) => (
                    <ModelChip
                        key={model.id}
                        model={model}
                        active={activeModel === model.slug}
                        onClick={() =>
                            setParam('model', activeModel === model.slug ? null : model.slug)
                        }
                    />
                ))}
            </div>

            {/* ── RIGHT: Sort tabs ─────────────────────────────────────────── */}
            <div className="flex items-center gap-0.5 shrink-0">
                {SORTS.map((s) => {
                    const active = activeSort === s.key
                    return (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => setParam('sort', s.key === 'recent' ? null : s.key)}
                            className={cn(
                                'relative h-8 px-3.5 rounded-full text-sm font-medium transition-colors',
                                active
                                    ? 'bg-[#F5F0EB] text-black'
                                    : 'text-[#666] hover:text-black'
                            )}
                        >
                            {s.label}
                        </button>
                    )
                })}
            </div>

        </div>
    )
}

/* ── Model chip with logo ───────────────────────────────────────────────── */
function ModelChip({ model, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-full border text-sm font-medium transition-colors',
                active
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-[#333] border-[#E8E3DE] hover:border-[#999]'
            )}
        >
            <ModelLogo model={model} active={active} />
            <span>{model.name}</span>
            {model.isNew && (
                <span className="ml-0.5 text-[10px] font-bold text-[#FF6B35] uppercase tracking-wide">
                    NEW
                </span>
            )}
        </button>
    )
}

function ModelLogo({ model, active }) {
    if (model.logoUrl) {
        return (
            <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm">
                <Image
                    src={model.logoUrl}
                    alt={model.name}
                    fill
                    sizes="16px"
                    className={cn('object-contain', active && 'brightness-0 invert')}
                />
            </span>
        )
    }

    // Fallback: coloured initial letter
    return (
        <span
            className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-[9px] font-bold',
                active ? 'bg-white/20 text-white' : 'bg-[#F5F0EB] text-[#555]'
            )}
        >
            {model.name.charAt(0).toUpperCase()}
        </span>
    )
}
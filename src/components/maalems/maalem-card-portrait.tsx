'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Keeps a missing or rejected public image from leaving a broken portrait. */
export function MaalemCardPortrait({ src, name, initials, fallbackLabel, expanded = false, compact = false, sizes }: {
  src: string | null
  name: string
  initials: string
  fallbackLabel: string
  /** Decorative copy (no alt text). */
  expanded?: boolean
  /** Small thumbnail: smaller initials, no hover zoom. */
  compact?: boolean
  sizes?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || failedSrc === src) {
    return <div
      className="absolute inset-0 grid place-items-center overflow-hidden bg-[radial-gradient(120%_90%_at_30%_10%,#2b2b2b,#0d0d0d)]"
      role={expanded ? undefined : 'img'}
      aria-label={expanded ? undefined : `${name} — ${fallbackLabel}`}
    >
      <span className="bd-grid absolute inset-0 opacity-70 [--grid-color:rgba(255,255,255,0.05)] [background-size:28px_28px]" aria-hidden="true" />
      <span className={cn('text-gold relative font-extrabold tracking-tight', compact ? 'text-lg' : 'text-5xl')} aria-hidden="true">{initials}</span>
    </div>
  }
  return <Image
    src={src}
    alt={expanded ? '' : name}
    fill
    sizes={sizes ?? '(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw'}
    className={cn('object-cover object-[center_30%]', !compact && 'transition-transform duration-[1600ms] ease-[var(--ease-slow)] group-hover:scale-[1.06]')}
    onError={() => setFailedSrc(src)}
  />
}

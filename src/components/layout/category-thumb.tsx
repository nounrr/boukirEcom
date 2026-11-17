'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import type { Category } from '@/types/category'

// Teintes de secours (catégorie sans image) : choisies d'après l'id pour rester stables.
const FALLBACK_TONES = [
  'from-amber-100 to-orange-200 text-orange-700 dark:from-amber-500/15 dark:to-orange-500/25 dark:text-orange-300',
  'from-sky-100 to-blue-200 text-blue-700 dark:from-sky-500/15 dark:to-blue-500/25 dark:text-blue-300',
  'from-emerald-100 to-teal-200 text-teal-700 dark:from-emerald-500/15 dark:to-teal-500/25 dark:text-teal-300',
  'from-rose-100 to-pink-200 text-rose-700 dark:from-rose-500/15 dark:to-pink-500/25 dark:text-rose-300',
  'from-violet-100 to-indigo-200 text-indigo-700 dark:from-violet-500/15 dark:to-indigo-500/25 dark:text-indigo-300',
  'from-stone-100 to-stone-200 text-stone-700 dark:from-stone-500/15 dark:to-stone-500/25 dark:text-stone-300',
]

export function categoryImageSrc(category?: Category | null) {
  return toAbsoluteImageUrl(category?.image_url)
}

/** Vignette d'une catégorie : son image, ou une pastille colorée avec l'initiale. */
export function CategoryThumb({
  category,
  label,
  className,
  imgClassName,
  rounded = 'rounded-xl',
}: {
  category: Category
  label: string
  className?: string
  imgClassName?: string
  rounded?: string
}) {
  const src = categoryImageSrc(category)
  const [failed, setFailed] = useState(false)
  const initial = (label || category.nom || 'C').trim().charAt(0).toUpperCase()
  const tone = FALLBACK_TONES[Math.abs(Number(category.id) || 0) % FALLBACK_TONES.length]

  return (
    <span
      className={cn('relative block shrink-0 overflow-hidden bg-muted ring-1 ring-black/5 dark:ring-white/10', rounded, className)}
      aria-hidden="true"
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- vignettes servies par l'API, chargées à la demande
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover transition-transform duration-500', imgClassName)}
        />
      ) : (
        <span className={cn('grid h-full w-full place-items-center bg-linear-to-br font-bold', tone)}>
          {initial}
        </span>
      )}
    </span>
  )
}

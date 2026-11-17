'use client'

import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { API_CONFIG } from '@/lib/api-config'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import type { Category } from '@/types/category'

// Teintes de secours (catégorie sans aucune photo) : choisies d'après l'id pour rester stables.
const FALLBACK_TONES = [
  'from-amber-100 to-orange-200 text-orange-700 dark:from-amber-500/15 dark:to-orange-500/25 dark:text-orange-300',
  'from-sky-100 to-blue-200 text-blue-700 dark:from-sky-500/15 dark:to-blue-500/25 dark:text-blue-300',
  'from-emerald-100 to-teal-200 text-teal-700 dark:from-emerald-500/15 dark:to-teal-500/25 dark:text-teal-300',
  'from-rose-100 to-pink-200 text-rose-700 dark:from-rose-500/15 dark:to-pink-500/25 dark:text-rose-300',
  'from-violet-100 to-indigo-200 text-indigo-700 dark:from-violet-500/15 dark:to-indigo-500/25 dark:text-indigo-300',
  'from-stone-100 to-stone-200 text-stone-700 dark:from-stone-500/15 dark:to-stone-500/25 dark:text-stone-300',
]

/** Photo d'une catégorie : son image (scène, à recadrer) ou celle d'un de ses produits (à afficher en entier). */
export type CategoryCover = { src: string; kind: 'category' | 'product' }

export function categoryImageSrc(category?: Category | null) {
  return toAbsoluteImageUrl(category?.image_url)
}

/* ------------------------------------------------------------------ */
/* Photo de secours : premier produit de la catégorie qui a une image. */
/* Un appel par catégorie sans image, mis en cache pour toute la visite. */
/* ------------------------------------------------------------------ */
const productCoverCache = new Map<number, string | null>()
const productCoverInflight = new Map<number, Promise<string | null>>()

type ProductLike = { image_url?: string | null }

function fetchProductCover(categoryId: number): Promise<string | null> {
  if (productCoverCache.has(categoryId)) return Promise.resolve(productCoverCache.get(categoryId) ?? null)
  const pending = productCoverInflight.get(categoryId)
  if (pending) return pending

  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}?category_id=${categoryId}&per_page=6&in_stock_only=false`
  const request = fetch(url, { headers: { accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { products?: ProductLike[] } | null) => {
      const list = Array.isArray(data?.products) ? data.products : []
      const hit = list.find((p) => String(p?.image_url ?? '').trim())
      return hit ? toAbsoluteImageUrl(hit.image_url) : null
    })
    .catch(() => null)
    .then((src) => {
      productCoverCache.set(categoryId, src)
      productCoverInflight.delete(categoryId)
      return src
    })
  productCoverInflight.set(categoryId, request)
  return request
}

function ownOrDescendantImage(category: Category, childrenMap: Map<number, Category[]>, depth = 0): string | null {
  const own = categoryImageSrc(category)
  if (own || depth > 3) return own
  for (const child of childrenMap.get(category.id) ?? []) {
    const found = ownOrDescendantImage(child, childrenMap, depth + 1)
    if (found) return found
  }
  return null
}

/**
 * Photos des catégories affichées : image de la catégorie, sinon d'une sous-catégorie,
 * sinon d'un produit du rayon (chargée à la demande, après un court délai pour ne pas
 * lancer d'appels quand la souris ne fait que passer).
 */
export function useCategoryCovers(
  visible: Category[],
  childrenMap: Map<number, Category[]>,
  enabled = true
) {
  const [, setVersion] = useState(0)

  const missingKey = useMemo(
    () =>
      visible
        .filter((c) => !ownOrDescendantImage(c, childrenMap))
        .map((c) => c.id)
        .join(','),
    [visible, childrenMap]
  )

  useEffect(() => {
    if (!enabled || !missingKey) return
    let alive = true
    const timer = window.setTimeout(() => {
      for (const id of missingKey.split(',').map(Number)) {
        if (productCoverCache.has(id)) continue
        void fetchProductCover(id).then(() => {
          if (alive) setVersion((v) => v + 1)
        })
      }
    }, 120)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [missingKey, enabled])

  return (category: Category): CategoryCover | null => {
    const own = ownOrDescendantImage(category, childrenMap)
    if (own) return { src: own, kind: 'category' }
    const product = productCoverCache.get(category.id)
    return product ? { src: product, kind: 'product' } : null
  }
}

/** Vignette d'une catégorie : sa photo, ou une pastille colorée avec l'initiale. */
export function CategoryThumb({
  category,
  label,
  cover,
  className,
  imgClassName,
  rounded = 'rounded-xl',
}: {
  category: Category
  label: string
  /** Photo déjà résolue (useCategoryCovers). Sinon, l'image propre de la catégorie. */
  cover?: CategoryCover | null
  className?: string
  imgClassName?: string
  rounded?: string
}) {
  const resolved: CategoryCover | null =
    cover !== undefined ? cover : (() => {
      const src = categoryImageSrc(category)
      return src ? { src, kind: 'category' as const } : null
    })()
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const initial = (label || category.nom || 'C').trim().charAt(0).toUpperCase()
  const tone = FALLBACK_TONES[Math.abs(Number(category.id) || 0) % FALLBACK_TONES.length]
  const showImage = resolved && resolved.src !== failedSrc

  return (
    <span
      className={cn(
        'relative block shrink-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/10',
        showImage && resolved?.kind === 'product' ? 'bg-white' : 'bg-muted',
        rounded,
        className
      )}
      aria-hidden="true"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- photos servies par l'API, chargées à la demande
        <img
          src={resolved.src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(resolved.src)}
          className={cn(
            'h-full w-full transition-transform duration-500',
            resolved.kind === 'product' ? 'object-contain p-[8%]' : 'object-cover',
            imgClassName
          )}
        />
      ) : (
        <span className={cn('grid h-full w-full place-items-center bg-linear-to-br font-bold', tone)}>
          {initial}
        </span>
      )}
    </span>
  )
}

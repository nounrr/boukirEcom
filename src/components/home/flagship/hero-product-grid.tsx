"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Flame, Pause, Play } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useShowcaseProducts } from "@/components/home/use-showcase-products"
import { displayPrice, interleaveByCategory, pickNext, seededRandom, shuffle } from "@/lib/home/product-rotation"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { getLocalizedCategoryName, getLocalizedProductName } from "@/lib/localized-fields"
import { splitPrice } from "@/lib/product-ui"
import { productHref } from "@/lib/seo/product-url"
import { cn } from "@/lib/utils"
import type { ProductListItem } from "@/types/api/products"
import type { HeroSlideApi } from "@/types/api/hero-slides"

/** 3 × 3 cases. */
const CELLS = 9
/** Each product stays this long, then another one takes its place. */
const LIFETIME = 6000
const FALLBACK_IMAGE = "/product-fallbacks/metal.webp"

/**
 * One product, with what makes it worth a look: category, brand, price (and the old price when on promo),
 * stock, and a thin gold line that fills during its 6 seconds on screen.
 */
function Tile({
  product,
  locale,
  delay,
  running,
  onDone,
}: {
  product: ProductListItem
  locale: string
  /** Negative delay: where this card starts in its 6 s (cards are staggered so they change one after another). */
  delay: number
  running: boolean
  onDone: () => void
}) {
  const tCommon = useTranslations("common")
  const [src, setSrc] = useState(toAbsoluteImageUrl(product.image_url) || FALLBACK_IMAGE)
  const name = getLocalizedProductName(product as never, locale) || product.designation
  const category = product.categorie ? getLocalizedCategoryName(product.categorie as never, locale) : ""
  const price = displayPrice(product)
  const discount = product.prix_promo && product.prix_promo < product.prix_vente ? Math.round(((product.prix_vente - product.prix_promo) / product.prix_vente) * 100) : 0
  const parts = splitPrice(price, locale)
  const inStock = product.in_stock ?? Number(product.quantite_disponible) > 0

  return (
    <Link
      href={productHref(product as never, locale)}
      title={name}
      className="group/tile relative flex size-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white text-ink shadow-[0_18px_40px_-28px_rgba(13,13,13,0.7)] outline-none ring-1 ring-black/5 transition-[translate,box-shadow,border-color] duration-500 ease-hover hover:-translate-y-0.5 hover:border-brand-orange/70 hover:shadow-[0_26px_50px_-24px_rgba(242,169,0,0.55)] focus-visible:ring-[3px] focus-visible:ring-brand-orange/60"
    >
      {/* Photo on a warm halo */}
      <div className="relative min-h-0 flex-1 bg-white">
        <Image
          src={src}
          alt=""
          fill
          sizes="190px"
          className="object-contain p-3 drop-shadow-[0_10px_12px_rgba(13,13,13,0.18)] transition-[scale,rotate] duration-[1200ms] ease-[var(--ease-slow)] group-hover/tile:-rotate-2 group-hover/tile:scale-[1.09]"
          onError={() => setSrc(FALLBACK_IMAGE)}
        />
        <div className="absolute inset-x-1.5 top-1.5 flex items-start justify-between gap-1">
          {category ? (
            <span className="max-w-[62%] truncate rounded-full bg-ink/80 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">{category}</span>
          ) : <span />}
          {discount > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gold px-1.5 py-0.5 text-[9.5px] font-extrabold text-ink shadow-sm">
              <Flame className="size-2.5" strokeWidth={2.6} aria-hidden="true" />-{discount}%
            </span>
          ) : product.brand?.nom ? (
            <span className="max-w-[45%] shrink-0 truncate rounded-full border border-gold/60 bg-white/90 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase text-[#9a6b00]">{product.brand.nom}</span>
          ) : null}
        </div>
        <span className="absolute bottom-1.5 end-1.5 grid size-6 translate-y-1 place-items-center rounded-full bg-ink text-white opacity-0 shadow transition-[opacity,translate] duration-500 group-hover/tile:translate-y-0 group-hover/tile:opacity-100" aria-hidden="true">
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>

      {/* Name, price, stock */}
      <div className="relative bg-white px-2.5 pb-2.5 pt-1.5">
        <p className="line-clamp-1 text-[11px] font-semibold leading-tight">{name}</p>
        <div className="mt-1 flex items-end justify-between gap-1">
          <p className="flex items-baseline gap-0.5 tabular text-ink">
            <span className="text-[15px] font-extrabold leading-none">{parts.int}</span>
            <span className="text-[10px] font-bold">{parts.mark}{parts.dec}</span>
            <span className="ms-0.5 text-[9px] font-semibold text-ink/50">{tCommon("currency")}</span>
          </p>
          {discount > 0 ? (
            <span className="text-[9.5px] font-semibold text-ink/40 line-through tabular">{Math.round(product.prix_vente)}</span>
          ) : (
            <span className={cn("flex items-center gap-1 text-[9px] font-semibold", inStock ? "text-emerald-700" : "text-ink/45")}>
              <span className={cn("size-1.5 rounded-full", inStock ? "bg-emerald-500" : "bg-ink/30")} aria-hidden="true" />
            </span>
          )}
        </div>
        {/* 6 s on screen: the line fills, then the next product comes in. */}
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-ink/5" aria-hidden="true">
          <span
            className="block h-full bg-gradient-to-r from-gold to-brand-orange"
            style={{ animation: `bd-hero-progress ${LIFETIME}ms linear ${delay}ms forwards`, animationPlayState: running ? "running" : "paused" }}
            onAnimationEnd={onDone}
          />
        </span>
      </div>
    </Link>
  )
}

/**
 * Right of the hero: 9 products of 550 DH and more, from many categories. Each one stays 6 s, then another
 * product takes its place: never one already on screen or already shown (until all had their turn), and from a
 * category nobody else is showing whenever possible. The cards change one after another, never all at once.
 * Pauses on hover, on focus, with the pause button, and when the visitor prefers reduced motion.
 */
export function HeroProductGrid({ locale }: { locale: string; adminSlides?: HeroSlideApi[] }) {
  const t = useTranslations("xp.home.hero")
  const { products, ready } = useShowcaseProducts()
  // Draw made in the browser only (no difference with the server render), once every list has answered.
  const [seed, setSeed] = useState<number | null>(null)
  useEffect(() => setSeed(Math.floor(Math.random() * 2 ** 31)), [])
  const pool = useMemo(() => (seed === null || !ready ? [] : interleaveByCategory(products, seededRandom(seed))), [products, seed, ready])

  // Index (in `pool`) of the product in each cell, plus a counter so a card restarts its 6 s when replaced.
  const [cells, setCells] = useState<number[]>([])
  const used = useRef(new Set<number>())
  useEffect(() => {
    used.current = new Set()
    const first: number[] = []
    for (let cell = 0; cell < Math.min(CELLS, pool.length); cell++) {
      const { index } = pickNext(pool, { shown: first, used: used.current, leaving: null })
      if (index < 0) break
      first.push(index)
      used.current.add(index)
    }
    setCells(first)
  }, [pool])

  const [hovered, setHovered] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  const canRotate = pool.length > CELLS
  const running = canRotate && !paused && !hovered && !reducedMotion

  const replace = useCallback((cell: number) => {
    setCells((current) => {
      if (!canRotate || current.length < CELLS) return current
      const { index, resetRound } = pickNext(pool, { shown: current, used: used.current, leaving: current[cell] })
      if (index < 0) return current
      if (resetRound) used.current = new Set(current)
      used.current.add(index)
      const next = current.slice()
      next[cell] = index
      return next
    })
  }, [pool, canRotate])

  // Cells change one after another: cell order shuffled once, each starts at its own point of the 6 s.
  const stagger = useMemo(() => {
    const order = shuffle(Array.from({ length: CELLS }, (_, i) => i), seededRandom((seed ?? 1) + 7))
    const offsets: number[] = []
    order.forEach((cell, rank) => { offsets[cell] = -Math.round(LIFETIME - ((rank + 1) * LIFETIME) / CELLS) })
    return offsets
  }, [seed])
  // The stagger only applies to the first card of each cell; replacements start fresh.
  const firstRound = useRef(new Set<number>())
  useEffect(() => { firstRound.current = new Set(Array.from({ length: CELLS }, (_, i) => i)) }, [pool])

  const header = (
    <div className="mb-5 flex items-center justify-between gap-4">
      <p className="kicker flex items-center gap-3 !text-[var(--accent-text)]">
        <span className="h-px w-8 bg-current" aria-hidden="true" />
        {t("ourProducts")}
      </p>
      <div className="flex items-center gap-3">
        {canRotate && !reducedMotion ? (
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? t("playProducts") : t("pauseProducts")}
            title={paused ? t("playProducts") : t("pauseProducts")}
            className="grid size-7 place-items-center rounded-full border border-ink/15 text-ink/70 transition-[background-color,color] duration-500 ease-hover hover:bg-ink/5 hover:text-ink dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {paused ? <Play className="size-3" aria-hidden="true" /> : <Pause className="size-3" aria-hidden="true" />}
          </button>
        ) : null}
        <Link href={`/${locale}/shop?min_price=550`} className="group inline-flex items-center gap-1.5 text-xs font-semibold text-ink/70 hover:text-ink dark:text-white/70 dark:hover:text-white">
          {t("seeAll")}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-[520px] xl:max-w-[560px]">
      {header}
      <ul
        data-no-reveal
        className="grid aspect-square grid-cols-3 grid-rows-3 gap-2.5 xl:gap-3"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(false)
        }}
      >
        {Array.from({ length: CELLS }, (_, cell) => {
          const product = cells[cell] !== undefined ? pool[cells[cell]] : undefined
          const delay = firstRound.current.has(cell) ? stagger[cell] ?? 0 : 0
          return (
            <li key={cell} className="relative min-h-0 min-w-0">
              {product ? (
                // The key changes with the product: the new card comes in with a flip.
                <div key={product.id} data-fade-ok className="size-full motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90 motion-safe:slide-in-from-bottom-2 motion-safe:duration-700">
                  <Tile
                    product={product}
                    locale={locale}
                    delay={delay}
                    running={running}
                    onDone={() => {
                      firstRound.current.delete(cell)
                      replace(cell)
                    }}
                  />
                </div>
              ) : (
                <div className="size-full animate-pulse rounded-2xl bg-ink/5 dark:bg-white/10" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

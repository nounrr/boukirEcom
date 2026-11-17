"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Flame, Pause, Play } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"

import { productModel } from "@/components/home/professional/professional-catalog"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { getLocalizedProductName } from "@/lib/localized-fields"
import { splitPrice } from "@/lib/product-ui"
import { productHref } from "@/lib/seo/product-url"
import { cn } from "@/lib/utils"
import { useGetFeaturedPromoQuery, useGetNewArrivalsQuery, useGetProductQuery } from "@/state/api/products-api-slice"
import type { HeroSlideApi } from "@/types/api/hero-slides"

/** 3 × 3 cases. */
const CELLS = 9
/** Nombre de promotions et de nouveautés chargées : assez pour renouveler la grille longtemps. */
const POOL_SIZE = 40
/** Une case change toutes les… */
const SWAP_EVERY = 2600
const FALLBACK_IMAGE = "/product-fallbacks/metal.webp"

type TileModel = {
  id: number
  name: string
  designation?: string | null
  designation_ar?: string | null
  designation_en?: string | null
  designation_zh?: string | null
  price: number | null
  originalPrice?: number
  image: string
  fallbackImage?: string
}
type PoolItem = { key: string; kind: "product"; model: TileModel } | { key: string; kind: "admin"; productId: number; fallbackImage?: string | null }

/** Petit générateur pseudo-aléatoire (reproductible pour un tirage donné). */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(list: T[], random: () => number): T[] {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Fiche produit (GET /products/:id) → modèle de la case. */
function detailToTile(p: Record<string, any>, fallbackImage?: string | null): TileModel {
  const promo = Boolean(p.prix_promo && p.prix_promo < p.prix_vente)
  return {
    id: p.id,
    name: p.designation,
    designation: p.designation,
    designation_ar: p.designation_ar,
    designation_en: p.designation_en,
    designation_zh: p.designation_zh,
    price: promo ? p.prix_promo : p.prix_vente ?? null,
    originalPrice: promo ? p.prix_vente : undefined,
    image: toAbsoluteImageUrl(p.image_url) || toAbsoluteImageUrl(fallbackImage) || FALLBACK_IMAGE,
    fallbackImage: FALLBACK_IMAGE,
  }
}

function Tile({ model, locale }: { model: TileModel; locale: string }) {
  const tCommon = useTranslations("common")
  const [src, setSrc] = useState(model.image)
  const name = getLocalizedProductName(model as never, locale) || model.name
  const discount = model.price != null && model.originalPrice && model.originalPrice > model.price
    ? Math.round(((model.originalPrice - model.price) / model.originalPrice) * 100)
    : 0
  const price = model.price != null ? splitPrice(model.price, locale) : null

  return (
    <Link
      href={productHref(model as never, locale)}
      title={name}
      className="group/tile relative flex size-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white text-ink shadow-[0_18px_40px_-28px_rgba(13,13,13,0.7)] outline-none transition-[translate,box-shadow,border-color] duration-500 ease-hover hover:-translate-y-0.5 hover:border-brand-orange/60 hover:shadow-[0_24px_46px_-26px_rgba(13,13,13,0.85)] focus-visible:ring-[3px] focus-visible:ring-brand-orange/60 dark:border-white/10"
    >
      <div className="relative min-h-0 flex-1">
        <Image
          src={src}
          alt=""
          fill
          sizes="180px"
          className="object-contain p-2.5 transition-[scale] duration-[1200ms] ease-[var(--ease-slow)] group-hover/tile:scale-[1.07]"
          onError={() => setSrc(model.fallbackImage || FALLBACK_IMAGE)}
        />
        {discount > 0 ? (
          <span className="absolute start-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-extrabold text-ink shadow-sm">
            <Flame className="size-2.5" strokeWidth={2.6} aria-hidden="true" />-{discount}%
          </span>
        ) : null}
      </div>
      <div className="border-t border-ink/5 bg-white px-2.5 pb-2 pt-1.5">
        <p className="truncate text-[11px] font-semibold leading-tight">{name}</p>
        {price ? (
          <p className="mt-0.5 flex items-baseline gap-0.5 tabular text-ink">
            <span className="text-sm font-extrabold leading-none">{price.int}</span>
            <span className="text-[10px] font-bold">{price.mark}{price.dec}</span>
            <span className="ms-0.5 text-[9px] font-semibold text-ink/50">{tCommon("currency")}</span>
          </p>
        ) : null}
      </div>
    </Link>
  )
}

function AdminTile({ productId, fallbackImage, locale }: { productId: number; fallbackImage?: string | null; locale: string }) {
  const { data } = useGetProductQuery(String(productId))
  if (!data) return <div className="size-full animate-pulse rounded-2xl bg-ink/5 dark:bg-white/10" />
  return <Tile model={detailToTile(data as Record<string, any>, fallbackImage)} locale={locale} />
}

/**
 * Droite du hero : un carré de 9 produits (produits « Hero Slides » du back-office, promotions,
 * nouveautés), tirés au hasard à chaque visite. Toutes les ~2,6 s une case au hasard est remplacée
 * par un produit qui n'est pas déjà affiché. Pause au survol, au focus, sur demande, et quand
 * l'utilisateur préfère réduire les animations.
 */
export function HeroProductGrid({ locale, adminSlides }: { locale: string; adminSlides?: HeroSlideApi[] }) {
  const t = useTranslations("xp.home.hero")
  const { data: promoData } = useGetFeaturedPromoQuery(POOL_SIZE)
  const { data: newData } = useGetNewArrivalsQuery(POOL_SIZE)
  // Tirage fait côté navigateur uniquement (pas de différence avec le rendu serveur).
  const [seed, setSeed] = useState<number | null>(null)
  useEffect(() => setSeed(Math.floor(Math.random() * 2 ** 31)), [])

  const pool = useMemo<PoolItem[]>(() => {
    const admin: PoolItem[] = []
    const seen = new Set<number>()
    for (const slide of adminSlides ?? []) {
      const id = slide.type === "product" ? Number(slide.target?.product_id ?? slide.target?.id) : NaN
      if (!Number.isFinite(id) || seen.has(id)) continue
      seen.add(id)
      admin.push({ key: `a-${id}`, kind: "admin", productId: id, fallbackImage: slide.media?.image_url })
    }
    const withPhoto: PoolItem[] = []
    const withoutPhoto: PoolItem[] = []
    for (const item of [...(promoData ?? []), ...(newData ?? [])]) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      const entry: PoolItem = { key: `p-${item.id}`, kind: "product", model: productModel(item, locale) as TileModel }
      ;(item.image_url ? withPhoto : withoutPhoto).push(entry)
    }
    if (seed === null) return [...admin, ...withPhoto, ...withoutPhoto]
    // Les produits avec photo passent d'abord ; l'ordre change à chaque visite.
    const random = mulberry32(seed)
    return [...shuffle([...admin, ...withPhoto], random), ...shuffle(withoutPhoto, random)]
  }, [adminSlides, promoData, newData, locale, seed])

  // Indices (dans `pool`) des produits affichés dans les 9 cases, et prochain produit à faire entrer.
  const [cells, setCells] = useState<number[]>([])
  const nextIndex = useRef(CELLS)
  const lastCell = useRef(-1)
  useEffect(() => {
    setCells(Array.from({ length: Math.min(CELLS, pool.length) }, (_, i) => i))
    nextIndex.current = Math.min(CELLS, pool.length)
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

  const cellsRef = useRef(cells)
  useEffect(() => { cellsRef.current = cells }, [cells])
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      const current = cellsRef.current
      if (document.hidden || current.length < CELLS) return
      const shown = new Set(current)
      // Prochain produit du tirage qui n'est pas déjà dans la grille.
      let candidate = nextIndex.current % pool.length
      for (let tries = 0; tries < pool.length && shown.has(candidate); tries++) candidate = (candidate + 1) % pool.length
      if (shown.has(candidate)) return
      nextIndex.current = candidate + 1
      // Case au hasard, jamais deux fois de suite la même.
      let cell = Math.floor(Math.random() * CELLS)
      if (cell === lastCell.current) cell = (cell + 1 + Math.floor(Math.random() * (CELLS - 1))) % CELLS
      lastCell.current = cell
      const next = current.slice()
      next[cell] = candidate
      setCells(next)
    }, SWAP_EVERY)
    return () => window.clearInterval(timer)
  }, [running, pool.length])

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
        <Link href={`/${locale}/shop`} className="group inline-flex items-center gap-1.5 text-xs font-semibold text-ink/70 hover:text-ink dark:text-white/70 dark:hover:text-white">
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
          const item = cells[cell] !== undefined ? pool[cells[cell]] : undefined
          return (
            <li key={cell} className="relative min-h-0 min-w-0">
              {item ? (
                // La clé change avec le produit : la nouvelle carte entre en fondu.
                <div key={item.key} data-fade-ok className="size-full motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90 motion-safe:duration-700">
                  {item.kind === "product" ? (
                    <Tile model={item.model} locale={locale} />
                  ) : (
                    <AdminTile productId={item.productId} fallbackImage={item.fallbackImage} locale={locale} />
                  )}
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

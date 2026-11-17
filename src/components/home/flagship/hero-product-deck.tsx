"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"

import { isRequiredVariant } from "@/lib/product-card-price"
import { productModel } from "@/components/home/professional/professional-catalog"
import { ProductCardTile } from "@/components/shop/product-card-tile"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { cn } from "@/lib/utils"
import { useGetFeaturedPromoQuery, useGetNewArrivalsQuery, useGetProductQuery } from "@/state/api/products-api-slice"
import type { HeroSlideApi } from "@/types/api/hero-slides"

const DECK_SIZE = 6
/** Nombre de promotions et de nouveautés parmi lesquelles le paquet est tiré au hasard. */
const POOL_SIZE = 24

type CardModel = ReturnType<typeof productModel>
type DeckItem = { key: string; kind: "product"; model: CardModel } | { key: string; kind: "admin"; productId: number; fallbackImage?: string | null }

/** Maps a product detail (GET /products/:id) to the card model used by ProductCardTile. */
function detailToModel(p: Record<string, any>, fallbackImage?: string | null): CardModel {
  const promo = Boolean(p.prix_promo && p.prix_promo < p.prix_vente)
  return {
    id: p.id,
    name: p.designation,
    designation: p.designation,
    designation_ar: p.designation_ar,
    designation_en: p.designation_en,
    designation_zh: p.designation_zh,
    description: "",
    price: promo ? p.prix_promo : p.prix_vente,
    originalPrice: promo ? p.prix_vente : undefined,
    image: toAbsoluteImageUrl(p.image_url) || toAbsoluteImageUrl(fallbackImage) || "/product-fallbacks/metal.webp",
    fallbackImage: "/product-fallbacks/metal.webp",
    category: p.categorie?.nom ?? "",
    categoryObj: p.categorie ?? null,
    brand: p.brand?.nom,
    unit: p.base_unit,
    stock: p.quantite_disponible ?? 0,
    purchase_limit: p.purchase_limit,
    in_stock: p.in_stock,
    inStock: p.in_stock,
    rating: 0,
    reviews: 0,
    variants: (Array.isArray(p.variants) ? p.variants : p.variants?.all ?? []).map((v: Record<string, any>) => ({
      ...v, value: v.variant_name ?? v.name, image: v.image_url,
    })),
    isVariantRequired: isRequiredVariant(p.is_obligatoire_variant, p.isObligatoireVariant),
    is_wishlisted: Boolean(p.is_wishlisted),
    sale: p.pourcentage_promo > 0 ? { discount: p.pourcentage_promo } : undefined,
    badges: p.has_promo ? [{ text: "PROMO", variant: "promo" as const }] : [],
  } as CardModel
}

function AdminProductCard({ productId, fallbackImage }: { productId: number; fallbackImage?: string | null }) {
  const { data } = useGetProductQuery(String(productId))
  if (!data) return <div className="aspect-[1/1.45] w-full animate-pulse rounded-[1.4rem] bg-ink/5 dark:bg-white/10" />
  return <ProductCardTile product={detailToModel(data as Record<string, any>, fallbackImage)} viewMode="grid" isWide />
}

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

function shuffle<T>(list: T[], seed: number): T[] {
  const random = mulberry32(seed)
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const DRAG_THRESHOLD = 8
const SWIPE_DISTANCE = 90

/**
 * Right side of the hero: a deck of real product cards (add to cart, like and
 * share work in place). A new random draw at every visit, from the back-office
 * "Hero Slides" of type product, the promotions and the new arrivals.
 * The front card can be dragged left or right to bring the next or previous one.
 */
export function HeroProductDeck({ locale, active, adminSlides }: { locale: string; active: number; adminSlides?: HeroSlideApi[] }) {
  const t = useTranslations("xp.home.hero")
  const { data: promoData } = useGetFeaturedPromoQuery(POOL_SIZE)
  const { data: newData } = useGetNewArrivalsQuery(POOL_SIZE)
  const [manual, setManual] = useState(0)
  // Tirage aléatoire fait côté navigateur uniquement (pas de différence avec le rendu serveur).
  const [seed, setSeed] = useState<number | null>(null)
  useEffect(() => setSeed(Math.floor(Math.random() * 2 ** 31)), [])

  const items = useMemo<DeckItem[]>(() => {
    const candidates: DeckItem[] = []
    const seen = new Set<number>()
    for (const slide of adminSlides ?? []) {
      const id = slide.type === "product" ? Number(slide.target?.product_id ?? slide.target?.id) : NaN
      if (!Number.isFinite(id) || seen.has(id)) continue
      seen.add(id)
      candidates.push({ key: `a-${id}`, kind: "admin", productId: id, fallbackImage: slide.media?.image_url })
    }
    const withPhoto: DeckItem[] = []
    const withoutPhoto: DeckItem[] = []
    for (const item of [...(promoData ?? []), ...(newData ?? [])]) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      const entry: DeckItem = { key: `p-${item.id}`, kind: "product", model: productModel(item, locale) }
      ;(item.image_url ? withPhoto : withoutPhoto).push(entry)
    }
    if (seed === null) return [...candidates, ...withPhoto, ...withoutPhoto].slice(0, DECK_SIZE)
    // Les produits avec photo passent d'abord ; l'ordre change à chaque visite.
    return [...shuffle([...candidates, ...withPhoto], seed), ...shuffle(withoutPhoto, seed + 1)].slice(0, DECK_SIZE)
  }, [adminSlides, promoData, newData, locale, seed])

  // A manual pick lasts until the slider moves on.
  useEffect(() => setManual(0), [active])

  // ---- Glisser la carte de devant ----
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const pointer = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("button, input, select, textarea")) return
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointer.current
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return
      start.moved = true
      setDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    setDragX(dx)
  }
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointer.current
    pointer.current = null
    if (!start || !start.moved) return
    const dx = event.clientX - start.x
    if (dx <= -SWIPE_DISTANCE) setManual((m) => m + 1)
    else if (dx >= SWIPE_DISTANCE) setManual((m) => m - 1)
    setDragging(false)
    setDragX(0)
    // Le relâchement après un glisser n'ouvre pas la fiche produit.
    suppressClick.current = true
    window.setTimeout(() => { suppressClick.current = false }, 0)
  }

  const n = items.length
  if (n === 0) return <div className="mx-auto aspect-[1/1.45] w-full max-w-[330px] animate-pulse rounded-[1.6rem] bg-ink/5 dark:bg-white/5" aria-hidden="true" />
  const front = (((active + manual) % n) + n) % n

  return (
    <div className="relative">
      <div className="mx-auto mb-5 flex max-w-[420px] items-center justify-between gap-4">
        <p className="kicker flex items-center gap-3 !text-[var(--accent-text)]">
          <span className="h-px w-8 bg-current" aria-hidden="true" />
          {t("ourProducts")}
        </p>
        <Link href={`/${locale}/shop`} className="group inline-flex items-center gap-1.5 text-xs font-semibold text-ink/70 hover:text-ink dark:text-white/70 dark:hover:text-white">
          {t("seeAll")}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
      <div className="relative mx-auto h-[500px] w-full max-w-[300px] xl:h-[540px] xl:max-w-[320px]">
        {items.map((item, index) => {
          const k = (index - front + n) % n
          const isFront = k === 0
          const pose =
            k === 0
              ? "z-30 translate-x-0 rotate-0 scale-100 opacity-100"
              : k === 1
                ? "z-20 translate-x-[34%] translate-y-[3%] rotate-[7deg] scale-[0.86] opacity-90"
                : k === 2
                  ? "z-10 -translate-x-[34%] translate-y-[5%] -rotate-[7deg] scale-[0.82] opacity-75"
                  : "z-0 translate-y-[8%] scale-[0.76] opacity-0"
          return (
            <div
              key={item.key}
              data-fade-ok
              className={cn(
                "absolute inset-x-0 top-0 will-change-transform",
                dragging && isFront ? "transition-none" : "transition-all duration-[800ms] ease-hover",
                pose,
                !isFront && "pointer-events-none",
                isFront && "cursor-grab touch-pan-y select-none active:cursor-grabbing"
              )}
              style={isFront && dragX ? { transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)` } : undefined}
              aria-hidden={!isFront}
              inert={!isFront}
              onPointerDown={isFront ? onPointerDown : undefined}
              onPointerMove={isFront ? onPointerMove : undefined}
              onPointerUp={isFront ? endDrag : undefined}
              onPointerCancel={isFront ? endDrag : undefined}
              onClickCapture={isFront ? (event) => {
                if (suppressClick.current) {
                  event.preventDefault()
                  event.stopPropagation()
                }
              } : undefined}
              onDragStart={(event) => event.preventDefault()}
            >
              <div className="rounded-[1.4rem] shadow-[0_40px_80px_-40px_rgba(13,13,13,0.55)]">
                {item.kind === "product" ? (
                  <ProductCardTile product={item.model} viewMode="grid" isWide />
                ) : (
                  <AdminProductCard productId={item.productId} fallbackImage={item.fallbackImage} />
                )}
              </div>
            </div>
          )
        })}
        {/* click targets on the peeking cards bring them forward */}
        {n > 1
          ? [1, 2]
              .filter((k) => k < n)
              .map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setManual((m) => m + k)}
                  aria-label={t("nextProduct")}
                  className={cn("absolute top-[12%] z-40 h-[60%] w-[24%] rounded-2xl", k === 1 ? "-end-[22%]" : "-start-[22%]")}
                />
              ))
          : null}
      </div>
      <div className="mt-5 flex justify-center gap-1.5">
        {items.map((item, index) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setManual((m) => m + ((index - front + n) % n))}
            aria-label={`${index + 1} / ${n}`}
            aria-current={index === front ? "true" : undefined}
            className="grid h-4 place-items-center px-0.5"
          >
            <span className={cn("block h-1 rounded-full transition-all duration-500", index === front ? "w-6 bg-brand-orange" : "w-1.5 bg-ink/20 dark:bg-white/25")} />
          </button>
        ))}
      </div>
    </div>
  )
}

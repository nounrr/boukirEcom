"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { productModel } from "@/components/home/professional/professional-catalog"
import { ProductCardTile } from "@/components/shop/product-card-tile"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { cn } from "@/lib/utils"
import { useGetFeaturedPromoQuery, useGetNewArrivalsQuery, useGetProductQuery } from "@/state/api/products-api-slice"
import type { HeroSlideApi } from "@/types/api/hero-slides"

const DECK_SIZE = 4

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
    variants: [],
    isVariantRequired: false,
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

/**
 * Right side of the hero: a deck of real product cards (add to cart, like and
 * share work in place). Back-office "Hero Slides" of type product come first;
 * the deck is completed with promotions and new arrivals.
 */
export function HeroProductDeck({ locale, active, adminSlides }: { locale: string; active: number; adminSlides?: HeroSlideApi[] }) {
  const t = useTranslations("xp.home.hero")
  const { data: promoData } = useGetFeaturedPromoQuery(8)
  const { data: newData } = useGetNewArrivalsQuery(8)
  const [manual, setManual] = useState(0)

  const items = useMemo<DeckItem[]>(() => {
    const out: DeckItem[] = []
    const seen = new Set<number>()
    for (const slide of adminSlides ?? []) {
      const id = slide.type === "product" ? Number(slide.target?.product_id ?? slide.target?.id) : NaN
      if (!Number.isFinite(id) || seen.has(id) || out.length >= DECK_SIZE) continue
      seen.add(id)
      out.push({ key: `a-${id}`, kind: "admin", productId: id, fallbackImage: slide.media?.image_url })
    }
    const add = (list: typeof promoData) => {
      for (const item of list ?? []) {
        if (out.length >= DECK_SIZE || seen.has(item.id)) continue
        seen.add(item.id)
        out.push({ key: `p-${item.id}`, kind: "product", model: productModel(item, locale) })
      }
    }
    const withPhoto = (list: typeof promoData) => (list ?? []).filter((i) => i.image_url)
    add(withPhoto(promoData))
    add(withPhoto(newData))
    add(promoData)
    add(newData)
    return out
  }, [adminSlides, promoData, newData, locale])

  // A manual pick lasts until the slider moves on.
  useEffect(() => setManual(0), [active])

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
              className={cn("absolute inset-x-0 top-0 transition-all duration-[800ms] ease-[var(--ease-premium)] will-change-transform", pose, k !== 0 && "pointer-events-none")}
              aria-hidden={k !== 0}
              inert={k !== 0}
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
      <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
        {items.map((item, index) => (
          <span key={item.key} className={cn("h-1 rounded-full transition-all duration-500", index === front ? "w-6 bg-brand-orange" : "w-1.5 bg-ink/20 dark:bg-white/25")} />
        ))}
      </div>
    </div>
  )
}

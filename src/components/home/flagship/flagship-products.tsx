"use client"

import Image from "next/image"
import Link from "next/link"
import { Flame, Package, Pause, Play, Tag } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { productModel } from "@/components/home/professional/professional-catalog"
import { ProductCardTile } from "@/components/shop/product-card-tile"
import { MarqueeRow } from "@/components/ui/marquee-row"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetFeaturedPromoQuery, useGetNewArrivalsQuery } from "@/state/api/products-api-slice"
import type { ProductListItem } from "@/types/api/products"
import { canOptimize } from "@/lib/image-optimize"
import { getLocalizedProductName } from "@/lib/localized-fields"
import { productHref } from "@/lib/seo/product-url"
import { SectionHeading } from "./section-heading"

/**
 * « Nos promotions » — two rows of product cards that scroll continuously (the first right to
 * left, the second left to right), each card with an animated « Nos promotions » badge.
 * Promotional products first; while the catalogue has few of them, the latest products fill
 * the rows. Products without a price are left out. Pause button; rows can be dragged.
 * `variant="shop"`: compact version at the top of /shop (smaller heading, full-width rows).
 */
export function FlagshipNewArrivals({ locale, variant = "home" }: { locale: string; variant?: "home" | "shop" }) {
  const t = useTranslations("shop")
  const tr = useTranslations("xp.home.promoRail")
  const promo = useGetFeaturedPromoQuery(24)
  const arrivals = useGetNewArrivalsQuery(60)
  const [seed] = useState(() => Math.random() * 1000)
  const [paused, setPaused] = useState(false)

  const products = useMemo(() => {
    const priced = (list: ProductListItem[] | undefined) => (list ?? []).filter((p) => Number(p.prix_promo || p.prix_vente) > 0)
    const promos = shuffled(priced(promo.data), seed)
    // Fill up to two full rows with recent products when there are few promotions, also in a
    // new random order on every visit.
    const fill = promos.length >= 16 ? [] : shuffled(priced(arrivals.data), seed + 1)
    // Each product once, and never two cards with the same photo (variants, sizes of one model).
    const seenIds = new Set<number>()
    const seenPhotos = new Set<string>()
    const unique = [...promos, ...fill].filter((p) => {
      const photo = String(p.image_url ?? "").trim()
      if (seenIds.has(p.id) || (photo && seenPhotos.has(photo))) return false
      seenIds.add(p.id)
      if (photo) seenPhotos.add(photo)
      return true
    })
    return unique.slice(0, 32).map((p) => productModel(p, locale))
  }, [promo.data, arrivals.data, locale, seed])

  const rows = useMemo(() => [products.filter((_, i) => i % 2 === 0), products.filter((_, i) => i % 2 === 1)], [products])
  const isLoading = promo.isLoading || arrivals.isLoading
  const isError = promo.isError && arrivals.isError
  const title = tr("sectionTitle")
  const compact = variant === "shop"
  const titleId = compact ? "shop-promos-title" : "arrivals-title"

  return (
    <section
      className={compact ? "-mx-6 mb-6 overflow-hidden sm:-mx-8 lg:-mx-16" : "overflow-hidden bg-surface-2/60 py-20 lg:py-28"}
      aria-labelledby={titleId}
      aria-busy={isLoading}
    >
      <div className={compact ? "px-6 sm:px-8 lg:px-16" : "mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10"}>
        {(() => {
          const actions = (
            <div className="flex items-center gap-3">
              <Link href={`/${locale}/shop?sort=promo`} className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink">
                <Tag className="size-4" aria-hidden="true" />
                {t("viewAll")}
              </Link>
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                aria-pressed={paused}
                aria-label={paused ? tr("play") : tr("pause")}
                className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-accent-text motion-reduce:hidden"
              >
                {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
              </button>
            </div>
          )
          return compact ? (
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="kicker flex items-center gap-2 !text-[var(--accent-text)]">
                  <Flame className="size-3.5 motion-safe:animate-pulse" aria-hidden="true" />{tr("kicker")}
                </p>
                <h2 id={titleId} className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
              </div>
              {actions}
            </div>
          ) : (
            <SectionHeading id={titleId} kicker={tr("kicker")} title={title} description={tr("sectionDesc")} action={actions} />
          )
        })()}
        <div className={compact ? "mt-5" : "mt-10"} data-reveal>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[0, 1].map((row) => (
                <div key={row} className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className={compact ? "h-[84px] w-[280px] shrink-0 rounded-2xl" : "h-[420px] w-[270px] shrink-0 rounded-2xl"} />)}
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-border text-center">
              <Package className="size-7 text-accent-text" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">{isError ? t("loadError") : t("noProducts")}</p>
            </div>
          ) : (
            <div className={compact ? "-mx-6 flex flex-col gap-3 sm:-mx-8 lg:-mx-16" : "-mx-5 flex flex-col gap-5 sm:-mx-8 lg:-mx-10"}>
              {rows.map((row, index) => row.length === 0 ? null : (
                <MarqueeRow
                  key={index}
                  label={`${title} ${index + 1}`}
                  reverse={index === 1}
                  paused={paused}
                  secondsPerItem={4}
                  itemDir={locale === "ar" ? "rtl" : "ltr"}
                  // /shop: mini cards (small photo beside the name and price), so the rows stay low.
                  itemClassName={compact ? "w-[260px] pr-3 sm:w-[290px]" : "w-[250px] pr-4 sm:w-[280px] [&>div]:h-full"}
                  items={row.map((product) =>
                    compact ? (
                      <PromoMiniCard key={product.id} product={product} locale={locale} badge={tr("badge")} />
                    ) : (
                      <ProductCardTile key={product.id} product={product} viewMode="grid" isWide ribbon={tr("badge")} />
                    )
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function shuffled<T extends { id: number }>(items: T[], seed: number) {
  const score = (id: number) => {
    const x = Math.sin(id * 12.9898 + seed * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  return [...items].sort((a, b) => score(a.id) - score(b.id))
}

/**
 * Mini promotion card for /shop (about 84 px tall): small photo, animated badge, name and price.
 * The whole card opens the product.
 */
function PromoMiniCard({ product, locale, badge }: { product: ReturnType<typeof productModel>; locale: string; badge: string }) {
  const name = getLocalizedProductName(product as never, locale) || product.name
  const price = Number(product.price) || 0
  const [imageFailed, setImageFailed] = useState(false)
  const src = imageFailed ? product.fallbackImage : product.image
  return (
    <Link
      href={productHref(product, locale)}
      draggable={false}
      className="group flex h-[84px] items-center gap-3 rounded-2xl border border-border bg-card p-2 pe-3 transition-[border-color,box-shadow] duration-500 hover:border-primary/50 hover:shadow-[0_14px_30px_-22px_rgba(13,13,13,0.6)]"
    >
      <span className="relative size-[68px] shrink-0 overflow-hidden rounded-xl bg-white">
        {src ? (
          <Image src={src} alt="" fill sizes="68px" unoptimized={!canOptimize(src)} onError={() => setImageFailed(true)} className="object-contain p-1.5 transition-transform duration-700 group-hover:scale-105" />
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="relative inline-flex w-fit items-center gap-1 overflow-hidden whitespace-nowrap rounded-full bg-gradient-to-r from-[#e0303a] via-[#f25c05] to-gold px-1.5 py-px text-[8px] font-extrabold uppercase tracking-[0.08em] text-white">
          <span className="relative flex size-1.5" aria-hidden="true">
            <span className="absolute inline-flex size-full rounded-full bg-white opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-1.5 rounded-full bg-white" />
          </span>
          {badge}
          <span className="absolute inset-y-0 start-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent motion-safe:animate-[bd-sheen_2.2s_ease-in-out_infinite]" aria-hidden="true" />
        </span>
        <span className="line-clamp-1 text-[13px] font-semibold leading-snug text-foreground/90 group-hover:text-accent-text">{name}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-sm font-extrabold tabular-nums">{price.toLocaleString(locale === "ar" ? "ar-MA" : "fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-[9px] font-bold text-accent-text">MAD</span>
          {product.originalPrice ? (
            <span className="text-[11px] text-muted-foreground line-through tabular-nums">{Number(product.originalPrice).toLocaleString(locale === "ar" ? "ar-MA" : "fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          ) : null}
        </span>
      </span>
    </Link>
  )
}

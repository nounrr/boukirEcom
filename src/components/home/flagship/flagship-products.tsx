"use client"

import Link from "next/link"
import { ArrowRight, Package, Tag } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { productModel } from "@/components/home/professional/professional-catalog"
import { ProductCardTile } from "@/components/shop/product-card-tile"
import { DragCarousel } from "@/components/ui/drag-carousel"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetFeaturedPromoQuery, useGetNewArrivalsQuery } from "@/state/api/products-api-slice"
import { SectionHeading } from "./section-heading"

const SLIDE = "basis-[74%] min-[480px]:basis-[46%] md:basis-[31%] lg:basis-[calc((100%-3rem)/4)] [&>div]:h-full"

/**
 * « Nos promotions » — the promotional products in a random order (new order on every visit),
 * each card with its -X % promo badge. While the catalogue has no promotion, it shows the
 * new arrivals instead. Products without a price are left out. Draggable, fast autoplay.
 */
export function FlagshipNewArrivals({ locale }: { locale: string }) {
  const t = useTranslations("shop")
  const ta = useTranslations("xp.home.arrivals")
  const tr = useTranslations("xp.home.promoRail")
  const promo = useGetFeaturedPromoQuery(16)
  const arrivals = useGetNewArrivalsQuery(12)
  const [seed] = useState(() => Math.random() * 1000)

  const promoProducts = useMemo(
    () => shuffled((promo.data ?? []).filter((p) => Number(p.prix_promo || p.prix_vente) > 0), seed).map((p) => productModel(p, locale)),
    [promo.data, locale, seed]
  )
  const arrivalProducts = useMemo(
    () => (arrivals.data ?? []).filter((p) => Number(p.prix_promo || p.prix_vente) > 0).slice(0, 12).map((p) => productModel(p, locale)),
    [arrivals.data, locale]
  )

  const showPromos = promoProducts.length > 0
  const products = showPromos ? promoProducts : arrivalProducts
  const isLoading = promo.isLoading || (!showPromos && arrivals.isLoading)
  const isError = showPromos ? false : arrivals.isError
  const title = showPromos ? tr("title") : t("newArrivalsTitle")

  return (
    <section className="bg-surface-2/60 py-20 lg:py-28" aria-labelledby="arrivals-title" aria-busy={isLoading}>
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <SectionHeading
          id="arrivals-title"
          kicker={showPromos ? tr("kicker") : ta("kicker")}
          title={title}
          description={showPromos ? tr("desc") : t("newArrivalsDesc")}
          action={
            showPromos ? (
              <Link href={`/${locale}/shop?sort=promo`} className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink">
                <Tag className="size-4" aria-hidden="true" />
                {t("viewAll")}
              </Link>
            ) : (
              <Link href={`/${locale}/shop`} className="group inline-flex items-center gap-2 text-sm font-semibold">
                <span className="link-underline">{t("viewAll")}</span>
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            )
          }
        />
        <div className="mt-10" data-reveal>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-border text-center">
              <Package className="size-7 text-accent-text" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">{isError ? t("loadError") : t("noProducts")}</p>
            </div>
          ) : (
            <DragCarousel label={title} autoplay={2200} slideClassName={SLIDE}>
              {products.map((product) => (
                <ProductCardTile key={product.id} product={product} viewMode="grid" isWide />
              ))}
            </DragCarousel>
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

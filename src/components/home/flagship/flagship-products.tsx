"use client"

import Link from "next/link"
import { ArrowRight, Package, Tag } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { productModel } from "@/components/home/professional/professional-catalog"
import { ProductCardTile } from "@/components/shop/product-card-tile"
import { DragCarousel } from "@/components/ui/drag-carousel"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetFeaturedPromoQuery, useGetNewArrivalsQuery } from "@/state/api/products-api-slice"
import { SectionHeading } from "./section-heading"

const SLIDE = "basis-[74%] min-[480px]:basis-[46%] md:basis-[31%] lg:basis-[calc((100%-3rem)/4)] [&>div]:h-full"

/** New arrivals — real catalog data, draggable, autoplay with pause. */
export function FlagshipNewArrivals({ locale }: { locale: string }) {
  const t = useTranslations("shop")
  const ta = useTranslations("xp.home.arrivals")
  const { data, isLoading, isError } = useGetNewArrivalsQuery(12)
  const products = useMemo(() => (data ?? []).slice(0, 12).map((p) => productModel(p, locale)), [data, locale])

  return (
    <section className="bg-surface-2/60 py-20 lg:py-28" aria-labelledby="arrivals-title" aria-busy={isLoading}>
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <SectionHeading
          id="arrivals-title"
          kicker={ta("kicker")}
          title={t("newArrivalsTitle")}
          description={t("newArrivalsDesc")}
          action={
            <Link href={`/${locale}/shop`} className="group inline-flex items-center gap-2 text-sm font-semibold">
              <span className="link-underline">{t("viewAll")}</span>
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
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
            <DragCarousel label={t("newArrivalsTitle")} autoplay={4500} slideClassName={SLIDE}>
              {products.map((product) => (
                <ProductCardTile key={product.id} product={product} viewMode="grid" />
              ))}
            </DragCarousel>
          )}
        </div>
      </div>
    </section>
  )
}

/** Promotions — only rendered when real promotional products exist. */
export function FlagshipPromotions({ locale }: { locale: string }) {
  const t = useTranslations("shop")
  const tn = useTranslations("xp.nav")
  const { data, isLoading, isError } = useGetFeaturedPromoQuery(12)
  const products = useMemo(() => (data ?? []).map((p) => productModel(p, locale)), [data, locale])

  if (!isLoading && (isError || products.length === 0)) return null

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white lg:py-28" aria-labelledby="promos-title">
      <div className="absolute inset-0 bg-[radial-gradient(50%_70%_at_0%_0%,rgba(242,159,4,0.22),transparent_70%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <SectionHeading
          tone="dark"
          id="promos-title"
          kicker={tn("promotions")}
          title={t("featuredTitle")}
          description={t("featuredDesc")}
          action={
            <Link href={`/${locale}/shop?sort=promo`} className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink">
              <Tag className="size-4" aria-hidden="true" />
              {t("viewAll")}
            </Link>
          }
        />
        <div className="mt-10" data-reveal>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[380px] rounded-2xl bg-white/5" />)}
            </div>
          ) : (
            <DragCarousel label={t("featuredTitle")} autoplay={5000} tone="dark" slideClassName={SLIDE}>
              {products.map((product) => (
                <div key={product.id} className="h-full rounded-2xl bg-background text-foreground [&>div]:h-full">
                  <ProductCardTile product={product} viewMode="grid" />
                </div>
              ))}
            </DragCarousel>
          )}
        </div>
      </div>
    </section>
  )
}

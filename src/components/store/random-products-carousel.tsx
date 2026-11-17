"use client"

import Link from "next/link"
import { ArrowRight, Shuffle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { DragCarousel } from "@/components/ui/drag-carousel"
import { Skeleton } from "@/components/ui/skeleton"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { getLocalizedCategoryName, getLocalizedProductName } from "@/lib/localized-fields"
import { productHref } from "@/lib/seo/product-url"
import { useShowcaseProducts } from "@/components/home/use-showcase-products"
import { interleaveByCategory, seededRandom } from "@/lib/home/product-rotation"
import type { ProductListItem } from "@/types/api/products"

/** Products in the strip (all at 550 DH and more, neighbours from different categories). */
const SHOWN = 40
const SLIDE = "basis-[44%] min-[480px]:basis-[31%] md:basis-[22%] lg:basis-[16.66%] xl:basis-[14.28%]"

/** Petite carte produit : photo, nom, prix ; toute la carte ouvre la fiche. */
function MiniProductCard({ product, locale }: { product: ProductListItem; locale: string }) {
  const image = toAbsoluteImageUrl(product.image_url)
  const name = getLocalizedProductName(product as never, locale) || product.designation
  const price = product.prix_promo && product.prix_promo < product.prix_vente ? product.prix_promo : product.prix_vente
  const discounted = Boolean(product.prix_promo && product.prix_promo < product.prix_vente)
  const number = new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatted = number.format(Number(price) || 0)
  const category = product.categorie ? getLocalizedCategoryName(product.categorie as never, locale) : ""
  const inStock = product.in_stock ?? Number(product.quantite_disponible) > 0

  return (
    <Link
      href={productHref(product, locale)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[translate,box-shadow,border-color] duration-500 ease-hover hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-28px_rgba(13,13,13,0.55)]"
    >
      <span className="relative block aspect-square overflow-hidden bg-white">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- images servies par l'API
          <img src={image} alt="" loading="lazy" decoding="async" className="size-full object-contain p-3 transition-[scale] duration-700 ease-hover group-hover:scale-105" />
        ) : null}
        {discounted && product.pourcentage_promo > 0 ? (
          <span className="absolute start-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold text-ink">-{product.pourcentage_promo}%</span>
        ) : product.brand?.nom ? (
          <span className="absolute start-2 top-2 max-w-[70%] truncate rounded-full border border-gold/60 bg-white/95 px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#9a6b00]">{product.brand.nom}</span>
        ) : null}
        <span className={`absolute bottom-2 end-2 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold ${inStock ? "text-emerald-700" : "text-neutral-500"}`}>
          <span className={`size-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-neutral-400"}`} aria-hidden="true" />
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-3">
        {category ? <span className="truncate text-[9.5px] font-bold uppercase tracking-wide text-accent-text">{category}</span> : null}
        <span className="line-clamp-2 min-h-[2.4em] text-[12.5px] font-semibold leading-snug text-foreground/90 group-hover:text-accent-text">{name}</span>
        <span className="mt-auto flex items-baseline gap-1.5">
          <span className="text-sm font-extrabold tabular text-foreground">{formatted} <span className="text-[10px] font-bold text-accent-text">MAD</span></span>
          {discounted ? <span className="text-[10px] font-semibold text-muted-foreground line-through tabular">{number.format(Number(product.prix_vente))}</span> : null}
        </span>
      </span>
    </Link>
  )
}

/**
 * Deuxième section de l'accueil : petites cartes produits tirées au hasard à chaque visite
 * (promotions et nouveautés), qui défilent en continu (pause au survol) ; glisser pour parcourir.
 */
export function RandomProductsCarousel() {
  const locale = useLocale()
  const t = useTranslations("storePage.randomProducts")
  const { products: showcase, ready } = useShowcaseProducts()
  const [seed, setSeed] = useState<number | null>(null)
  useEffect(() => setSeed(Math.floor(Math.random() * 2 ** 31)), [])

  // 550 DH and more, with a photo, each once; neighbours from different categories; new draw each visit.
  const products = useMemo(
    () => (seed === null || !ready ? [] : interleaveByCategory(showcase, seededRandom(seed)).slice(0, SHOWN)),
    [showcase, seed, ready],
  )

  const loading = !ready || seed === null

  return (
    <section className="border-y border-border/60 bg-surface-2/40 py-10 lg:py-12" aria-labelledby="random-products-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker flex items-center gap-2 !text-[var(--accent-text)]">
              <Shuffle className="size-3.5" aria-hidden="true" />{t("kicker")}
            </p>
            <h2 id="random-products-title" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h2>
          </div>
          <Link href={`/${locale}/shop?min_price=550`} className="group inline-flex items-center gap-2 text-sm font-semibold">
            <span className="link-underline">{t("seeAll")}</span>
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={i > 1 ? "hidden sm:block" : undefined}>
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="mt-2 h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <DragCarousel label={t("title")} glide={0.6} slideClassName={SLIDE} controls="bottom" options={{ align: "start" }}>
            {products.map((product) => (
              <MiniProductCard key={product.id} product={product} locale={locale} />
            ))}
          </DragCarousel>
        ) : null}
      </div>
    </section>
  )
}

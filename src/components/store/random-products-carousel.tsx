"use client"

import Link from "next/link"
import { ArrowRight, Pause, Play, Shuffle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { MarqueeRow } from "@/components/ui/marquee-row"
import { Skeleton } from "@/components/ui/skeleton"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { getLocalizedCategoryName, getLocalizedProductName } from "@/lib/localized-fields"
import { productHref } from "@/lib/seo/product-url"
import { useShowcaseProducts } from "@/components/home/use-showcase-products"
import { interleaveByCategory, seededRandom } from "@/lib/home/product-rotation"
import type { ProductListItem } from "@/types/api/products"

/** Products in the three rows (all at 550 DH and more, neighbours from different categories). */
const SHOWN = 48
const ROWS = 3
const CARD = "w-[140px] sm:w-[156px] lg:w-[170px]"

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
 * Deuxième section de l'accueil : petites cartes produits tirées au hasard à chaque visite,
 * sur trois lignes qui défilent en continu, la 1re et la 3e de droite à gauche, la 2e de gauche
 * à droite. Seul le bouton pause les arrête.
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
  const [userPaused, setUserPaused] = useState(false)
  // Only the pause button stops the rows (hover and focus leave them moving).
  const paused = userPaused
  const tHero = useTranslations("xp.home.hero")

  // Card i goes to row i % 3: each row keeps the category mix.
  const rows = useMemo(
    () => Array.from({ length: ROWS }, (_, row) => products.filter((_, index) => index % ROWS === row)),
    [products],
  )

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
          <Link href={`/${locale}/shop?min_price=550`} className="group inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-gold ps-5 pe-1.5 text-sm font-bold text-ink shadow-[0_14px_30px_-14px_rgba(242,183,5,0.75)] ring-1 ring-black/5 transition-[translate,box-shadow] duration-600 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgba(242,183,5,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <span>{t("seeAll")}</span>
            <span className="grid size-8 place-items-center rounded-full bg-ink text-brand-yellow transition-transform duration-600 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </span>
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
          <>
            <div
              className="-mx-5 flex flex-col gap-3 sm:-mx-8 lg:mx-0"
            >
              {rows.map((row, index) => (
                <MarqueeRow
                  key={index}
                  label={t("rowLabel", { row: index + 1 })}
                  reverse={index % 2 === 1}
                  paused={paused}
                  secondsPerItem={4.6 + index * 0.4}
                  itemDir={locale === "ar" ? "rtl" : "ltr"}
                  itemClassName={CARD}
                  items={row.map((product) => (
                    <MiniProductCard key={product.id} product={product} locale={locale} />
                  ))}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setUserPaused((value) => !value)}
                aria-pressed={userPaused}
                aria-label={userPaused ? tHero("playProducts") : tHero("pauseProducts")}
                className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-accent-text motion-reduce:hidden"
              >
                {userPaused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

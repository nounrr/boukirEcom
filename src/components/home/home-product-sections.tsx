'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'
import { useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import { ProductCardTile } from '@/components/shop/product-card-tile'
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  useGetFeaturedPromoQuery,
  useGetNewArrivalsQuery,
} from '@/state/api/products-api-slice'
import type { ProductListItem } from '@/types/api/products'
import { normalizeLocale } from '@/i18n/locale'
import { getLocalizedCategoryName } from '@/lib/localized-fields'

function getCategoryLabel(
  category:
    | { nom: string; nom_ar?: string | null; nom_en?: string | null; nom_zh?: string | null }
    | undefined,
  locale: string
) {
  return getLocalizedCategoryName(category, locale)
}

function toProductCardModel(product: ProductListItem, locale: string) {
  const currentPrice = product.prix_promo || product.prix_vente
  const hasDiscount = product.prix_promo && product.prix_promo < product.prix_vente
  const stockFlag = (product as any)?.in_stock ?? (product as any)?.inStock

  return {
    id: product.id,
    name: product.designation,
    description: '',
    price: currentPrice,
    originalPrice: hasDiscount ? product.prix_vente : undefined,
    image: product.image_url || '',
    category: getCategoryLabel(product.categorie, locale),
    brand: product.brand?.nom,
    unit: product.base_unit,
    stock: product.quantite_disponible,
    purchase_limit: typeof (product as any)?.purchase_limit === 'number' ? (product as any).purchase_limit : undefined,
    in_stock: typeof stockFlag === 'boolean' ? stockFlag : undefined,
    inStock: typeof stockFlag === 'boolean' ? stockFlag : undefined,
    rating: 0,
    reviews: 0,
    variants:
      product.variants?.all?.map((v) => ({
        id: v.id,
        name: v.type,
        value: v.name,
        available: v.available,
        image: v.image_url ?? undefined,
      })) || [],
    isVariantRequired:
      product.is_obligatoire_variant === true || product.isObligatoireVariant === true,
    is_wishlisted: product.is_wishlisted || false,
    sale:
      product.pourcentage_promo > 0
        ? { discount: product.pourcentage_promo }
        : undefined,
    badges: [
      ...(product.has_promo ? [{ text: 'PROMO', variant: 'promo' as const }] : []),
    ],
  }
}

function ProductRail({
  title,
  description,
  href,
  products,
  isLoading,
  locale,
}: {
  title: string
  description?: string
  href: string
  products: ProductListItem[]
  isLoading: boolean
  locale: string
}) {
  const cardProducts = useMemo(() => products.map((p) => toProductCardModel(p, locale)), [products, locale])
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const canLoop = cardProducts.length > 5
  const isRtl = locale === 'ar'

  const contentClassName = useMemo(
    () =>
      [
        'cursor-grab select-none active:cursor-grabbing justify-start sm:justify-center',
        // Our shared Carousel uses -ml-4 + pl-4 spacing; for RTL we want the mirror.
        // Override the base utilities via class order (these are appended last).
        isRtl ? 'ml-0 -mr-4 flex-row-reverse' : '',
      ]
        .filter(Boolean)
        .join(' '),
    [isRtl]
  )

  const itemClassName = useMemo(
    () =>
      [
        'flex-none shrink-0 basis-[260px] sm:basis-[280px]',
        // Mirror the base CarouselItem padding (pl-4) for RTL.
        isRtl ? 'pl-0 pr-4' : '',
      ]
        .filter(Boolean)
        .join(' '),
    [isRtl]
  )

  useEffect(() => {
    if (!api) return
    if (isPaused) return
    if (!canLoop) return

    const id = window.setInterval(() => {
      api.scrollNext()
    }, 3200)

    return () => window.clearInterval(id)
  }, [api, canLoop, isPaused])

  return (
    <section className="py-10">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm md:text-base text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <Link href={href} className="shrink-0">
            <Button variant="outline" className="gap-2">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            <Carousel
              className="relative w-full"
              dir={isRtl ? 'rtl' : 'ltr'}
              opts={{
                align: 'center',
                direction: isRtl ? 'rtl' : 'ltr',
              }}
            >
              <CarouselContent className={contentClassName}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <CarouselItem key={i} className={itemClassName}>
                    <div className="w-full rounded-2xl border border-border/30 bg-card overflow-hidden">
                      <div className="h-[280px] bg-muted animate-pulse" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-muted/70 animate-pulse rounded" />
                        <div className="h-4 bg-muted/50 animate-pulse rounded w-2/3" />
                        <div className="h-6 bg-muted/60 animate-pulse rounded w-1/3" />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        ) : cardProducts.length === 0 ? (
          <div className="border border-border/40 rounded-xl bg-card p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Aucun produit pour le moment.</p>
          </div>
        ) : (
              <div
                className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onFocusCapture={() => setIsPaused(true)}
                onBlurCapture={() => setIsPaused(false)}
              >
                <Carousel
                  className="relative w-full"
                  dir={isRtl ? 'rtl' : 'ltr'}
                  opts={{
                    loop: canLoop,
                    align: 'center',
                    direction: isRtl ? 'rtl' : 'ltr',
                    slidesToScroll: 1,
                  }}
                  setApi={(a) => setApi(a)}
                >
                  <CarouselContent className={contentClassName}>
                    {cardProducts.map((p) => (
                      <CarouselItem key={p.id} className={itemClassName}>
                        <ProductCardTile product={p} viewMode="grid" />
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {cardProducts.length > 5 && (
                    <>
                      <CarouselPrevious className="-left-4" />
                      <CarouselNext className="-right-4" />
                    </>
                  )}
                </Carousel>
              </div>
        )}
      </div>
    </section>
  )
}

export function HomeProductSections({
  locale,
  featuredTitle,
  featuredDesc,
  newArrivalsTitle,
  newArrivalsDesc,
}: {
    locale?: string
  featuredTitle: string
  featuredDesc?: string
  newArrivalsTitle: string
  newArrivalsDesc?: string
}) {
  const detectedLocale = useLocale()
  const activeLocale = normalizeLocale(locale ?? detectedLocale)

  const { data: featured, isLoading: isFeaturedLoading } = useGetFeaturedPromoQuery(12)
  const { data: newArrivals, isLoading: isNewLoading } = useGetNewArrivalsQuery(12)

  return (
    <div>
      <ProductRail
        title={featuredTitle}
        description={featuredDesc}
        href={`/${activeLocale}/shop?sort=promo`}
        products={featured ?? []}
        isLoading={isFeaturedLoading}
        locale={activeLocale}
      />
      <ProductRail
        title={newArrivalsTitle}
        description={newArrivalsDesc}
        href={`/${activeLocale}/shop?sort=newest`}
        products={newArrivals ?? []}
        isLoading={isNewLoading}
        locale={activeLocale}
      />
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
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
import {
  useCarouselAutoplay,
  useCarouselRuntimeState,
} from '@/hooks/use-carousel-playback'

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
        variant_name: v.variant_name ?? v.name,
        color_name: v.color_name,
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

function ProductGrid({
  title,
  description,
  products,
  isLoading,
  locale,
  viewAllLabel,
  emptyLabel,
}: {
  title: string
  description?: string
  products: ProductListItem[]
  isLoading: boolean
  locale: string
  viewAllLabel: string
  emptyLabel: string
}) {
  const cardProducts = useMemo(
    () => products.slice(0, 8).map((product) => toProductCardModel(product, locale)),
    [products, locale]
  )
  const isRtl = locale === 'ar'

  return (
    <section className="py-10 md:py-12" aria-busy={isLoading}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="mb-6 text-center md:mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h2>
          {description ? (
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="overflow-hidden rounded-2xl border border-border/30 bg-card shadow-sm motion-safe:animate-pulse"
              >
                <div className="aspect-square bg-muted" />
                <div className="space-y-3 p-3 sm:p-4">
                  <div className="h-3 w-2/5 rounded bg-muted/70" />
                  <div className="h-4 rounded bg-muted/80" />
                  <div className="h-5 w-1/2 rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        ) : cardProducts.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {cardProducts.map((product) => (
              <div key={product.id} className="min-w-0 [&>div]:h-full">
                <ProductCardTile product={product} viewMode="grid" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-7 flex justify-center md:mt-9">
          <Button asChild size="lg" className="min-w-40 gap-2 px-6 shadow-sm">
            <Link href={`/${locale}/shop`}>
              {viewAllLabel}
              <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function ProductRail({
  title,
  description,
  href,
  products,
  locale,
  viewAllLabel,
}: {
  title: string
  description?: string
  href: string
  products: ProductListItem[]
  locale: string
  viewAllLabel: string
}) {
  const cardProducts = useMemo(() => products.map((p) => toProductCardModel(p, locale)), [products, locale])
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const { isScrollable, isLooping } = useCarouselRuntimeState(api)
  const isRtl = locale === 'ar'

  const contentClassName = useMemo(
    () =>
      [
        'cursor-grab select-none active:cursor-grabbing',
        isScrollable === false ? 'justify-center' : 'justify-start',
      ]
        .filter(Boolean)
        .join(' '),
    [isScrollable]
  )

  const itemClassName = useMemo(
    () =>
      [
        'flex-none shrink-0 basis-[260px] sm:basis-[280px]',
      ]
        .filter(Boolean)
        .join(' '),
    []
  )

  useCarouselAutoplay({
    api,
    delay: 3600,
    enabled: isScrollable === true,
    paused: isHovered || isFocusWithin,
  })

  return (
    <section className="border-y border-border/30 bg-muted/20 py-10 md:py-12">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm md:text-base text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <Button asChild variant="outline" className="shrink-0 gap-2">
            <Link href={href}>
              {viewAllLabel}
              <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
          </Button>
        </div>

        <div
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocusCapture={() => setIsFocusWithin(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsFocusWithin(false)
            }
          }}
        >
          <Carousel
            className="relative w-full"
            data-looping={isLooping}
            data-scrollable={isScrollable ?? 'pending'}
            dir={isRtl ? 'rtl' : 'ltr'}
            opts={{
              loop: cardProducts.length > 1,
              align: 'center',
              direction: isRtl ? 'rtl' : 'ltr',
              slidesToScroll: 1,
            }}
            setApi={setApi}
          >
            <CarouselContent className={contentClassName}>
              {cardProducts.map((product) => (
                <CarouselItem key={product.id} className={itemClassName}>
                  <ProductCardTile product={product} viewMode="grid" />
                </CarouselItem>
              ))}
            </CarouselContent>

            {isScrollable && (
              <>
                <CarouselPrevious className={isRtl ? '-right-4' : '-left-4'} />
                <CarouselNext className={isRtl ? '-left-4' : '-right-4'} />
              </>
            )}
          </Carousel>
        </div>
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
  viewAllLabel,
  emptyLabel,
}: {
  locale?: string
  featuredTitle: string
  featuredDesc?: string
  newArrivalsTitle: string
  newArrivalsDesc?: string
  viewAllLabel: string
  emptyLabel: string
}) {
  const detectedLocale = useLocale()
  const activeLocale = normalizeLocale(locale ?? detectedLocale)

  const {
    data: featured,
    isLoading: isFeaturedLoading,
    isError: isFeaturedError,
  } = useGetFeaturedPromoQuery(12)
  const { data: newArrivals, isLoading: isNewLoading } = useGetNewArrivalsQuery(8)
  const showFeatured =
    !isFeaturedLoading && !isFeaturedError && (featured?.length ?? 0) > 0

  return (
    <>
      <ProductGrid
        title={newArrivalsTitle}
        description={newArrivalsDesc}
        products={newArrivals ?? []}
        isLoading={isNewLoading}
        locale={activeLocale}
        viewAllLabel={viewAllLabel}
        emptyLabel={emptyLabel}
      />

      {showFeatured ? (
        <ProductRail
          title={featuredTitle}
          description={featuredDesc}
          href={`/${activeLocale}/shop?sort=promo`}
          products={featured ?? []}
          locale={activeLocale}
          viewAllLabel={viewAllLabel}
        />
      ) : null}
    </>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, Package, Tag } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { HomeCatalogHighlights } from '@/components/home/home-catalog-highlights'
import { ProductCardTile } from '@/components/shop/product-card-tile'
import { Button } from '@/components/ui/button'
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { useCarouselAutoplay, useCarouselRuntimeState } from '@/hooks/use-carousel-playback'
import { API_CONFIG } from '@/lib/api-config'
import { getLocalizedCategoryName } from '@/lib/localized-fields'
import { cn } from '@/lib/utils'
import { useGetBrandsQuery } from '@/state/api/brands-api-slice'
import { useGetFeaturedPromoQuery, useGetNewArrivalsQuery } from '@/state/api/products-api-slice'
import type { Brand } from '@/types/brand'
import type { ProductListItem } from '@/types/api/products'

const MATERIAL_FALLBACKS = [
  '/product-fallbacks/mineral.webp',
  '/product-fallbacks/metal.webp',
  '/product-fallbacks/wood.webp',
  '/product-fallbacks/tile.webp',
] as const

function materialFallback(seed: number | string) {
  const value = String(seed)
  let hash = 0
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  return MATERIAL_FALLBACKS[hash % MATERIAL_FALLBACKS.length]
}

function absoluteImageUrl(src?: string | null) {
  const value = String(src ?? '').trim()
  if (!value || value === 'null' || value === 'undefined') return null
  if (/^https?:\/\//i.test(value)) return value
  const base = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '')
  const path = value.startsWith('/') ? value : `/${value}`
  return base ? `${base}${path}` : path
}

function productModel(product: ProductListItem, locale: string) {
  const price = product.prix_promo || product.prix_vente
  const discounted = Boolean(product.prix_promo && product.prix_promo < product.prix_vente)
  const stockFlag = (product as ProductListItem & { in_stock?: boolean; inStock?: boolean }).in_stock ??
    (product as ProductListItem & { inStock?: boolean }).inStock

  const fallbackImage = materialFallback(product.id)

  return {
    id: product.id,
    name: product.designation,
    designation: product.designation,
    designation_ar: product.designation_ar,
    designation_en: product.designation_en,
    designation_zh: product.designation_zh,
    description: '',
    price,
    originalPrice: discounted ? product.prix_vente : undefined,
    image: absoluteImageUrl(product.image_url) || fallbackImage,
    fallbackImage,
    category: getLocalizedCategoryName(product.categorie, locale),
    categoryObj: product.categorie,
    brand: product.brand?.nom,
    unit: product.base_unit,
    stock: product.quantite_disponible,
    purchase_limit: product.purchase_limit,
    in_stock: stockFlag,
    inStock: stockFlag,
    rating: 0,
    reviews: 0,
    variants: product.variants?.all?.map((variant) => ({
      id: variant.id,
      name: variant.type,
      type: variant.type,
      value: variant.name,
      available: variant.available,
      image: variant.image_url ?? undefined,
    })) ?? [],
    isVariantRequired: product.is_obligatoire_variant === true || product.isObligatoireVariant === true,
    is_wishlisted: product.is_wishlisted || false,
    sale: product.pourcentage_promo > 0 ? { discount: product.pourcentage_promo } : undefined,
    badges: product.has_promo ? [{ text: 'PROMO', variant: 'promo' as const }] : [],
  }
}

function EditorialHeading({
  index,
  title,
  description,
  action,
}: {
  index: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 grid items-end gap-5 border-b border-border pb-5 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          <span>{index}</span>
          <span className="h-px w-10 bg-primary" />
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-foreground sm:text-4xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

function ProductGridSection({ locale }: { locale: string }) {
  const t = useTranslations('shop')
  const isRtl = locale === 'ar'
  const { data, isLoading, isError } = useGetNewArrivalsQuery(8)
  const products = useMemo(() => (data ?? []).slice(0, 8).map((item) => productModel(item, locale)), [data, locale])

  return (
    <section className="bg-background py-10 md:py-20" aria-busy={isLoading}>
      <div className="container mx-auto px-5 sm:px-8 lg:px-16">
        <EditorialHeading
          index="02"
          title={t('newArrivalsTitle')}
          description={t('newArrivalsDesc')}
          action={
            <Button asChild variant="outline" className="w-fit rounded-sm border-foreground/25 bg-transparent font-bold">
              <Link href={`/${locale}/shop`}>
                {t('viewAll')}
                <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
              </Link>
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="border-b border-border pb-4">
                <Skeleton className="aspect-square rounded-sm" />
                <Skeleton className="mt-4 h-3 w-2/5" />
                <Skeleton className="mt-3 h-5 w-full" />
                <Skeleton className="mt-4 h-6 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center border border-dashed border-border bg-muted/20 px-6 text-center">
            <Package className="h-7 w-7 text-primary" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">{isError ? t('loadError') : t('noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="min-w-0 [&>div]:h-full">
                <ProductCardTile product={product} viewMode="grid" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function DealsSection({ locale }: { locale: string }) {
  const t = useTranslations('shop')
  const isRtl = locale === 'ar'
  const { data, isLoading, isError } = useGetFeaturedPromoQuery(12)
  const products = useMemo(() => (data ?? []).map((item) => productModel(item, locale)), [data, locale])
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [hovered, setHovered] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const { isScrollable, isLooping } = useCarouselRuntimeState(api)

  useCarouselAutoplay({ api, delay: 3900, enabled: isScrollable === true, paused: hovered || focusWithin })

  if (!isLoading && (isError || products.length === 0)) return null

  return (
    <section className="border-y border-[#d9c995] bg-[#f1e5bd] py-12 text-foreground md:py-16" aria-busy={isLoading}>
      <div className="container mx-auto px-5 sm:px-8 lg:px-16">
        <div className="mb-8 grid gap-5 border-b border-[#cfbd82] pb-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <span>03</span><span className="h-px w-10 bg-primary" /><Tag className="h-4 w-4" />
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] sm:text-4xl">{t('featuredTitle')}</h2>
          </div>
          <div className="flex items-end justify-between gap-5">
            <p className="max-w-lg text-sm leading-6 text-foreground/65">{t('featuredDesc')}</p>
            <Button asChild className="hidden shrink-0 rounded-sm font-bold sm:inline-flex">
              <Link href={`/${locale}/shop?sort=promo`}>
                {t('viewAll')}<ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[410px] rounded-sm bg-white/55" />)}
          </div>
        ) : (
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocusCapture={() => setFocusWithin(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false)
            }}
          >
            <Carousel
              dir={isRtl ? 'rtl' : 'ltr'}
              opts={{ loop: products.length > 1, align: 'start', direction: isRtl ? 'rtl' : 'ltr', slidesToScroll: 1 }}
              setApi={setApi}
              data-looping={isLooping}
            >
              <CarouselContent>
                {products.map((product) => (
                  <CarouselItem key={product.id} className="basis-[76%] min-[460px]:basis-[48%] md:basis-[34%] lg:basis-[25%]">
                    <div className="h-full bg-background text-foreground [&>div]:h-full"><ProductCardTile product={product} viewMode="grid" /></div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {isScrollable ? (
                <div className="mt-6 flex justify-end gap-2 rtl:justify-start">
                  <CarouselPrevious className="static! size-10! translate-none! rounded-none border-foreground/25 bg-white/35 text-foreground hover:bg-primary hover:text-primary-foreground" />
                  <CarouselNext className="static! size-10! translate-none! rounded-none border-foreground/25 bg-white/35 text-foreground hover:bg-primary hover:text-primary-foreground" />
                </div>
              ) : null}
            </Carousel>
          </div>
        )}
      </div>
    </section>
  )
}

function BrandLogo({ brand }: { brand: Brand }) {
  const image = absoluteImageUrl(brand.image_url)
  const [failed, setFailed] = useState(false)
  if (!image || failed) return <span className="max-w-full truncate text-center text-sm font-black uppercase tracking-[0.08em] text-foreground/76">{brand.nom}</span>
  return <Image src={image} alt={brand.nom} fill sizes="180px" unoptimized={/^https?:\/\//i.test(image)} className="object-contain p-4 grayscale transition-[filter,opacity,transform] duration-300 group-hover:scale-[1.03] group-hover:grayscale-0" onError={() => setFailed(true)} />
}

function BrandsSection({ locale }: { locale: string }) {
  const t = useTranslations('home')
  const isRtl = locale === 'ar'
  const { data = [], isLoading, isError } = useGetBrandsQuery()
  const items = useMemo(() => [...data].sort((a, b) => (a.nom || '').localeCompare(b.nom || '')).slice(0, 18), [data])

  return (
    <section className="border-y border-border bg-background py-10 md:py-16">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16">
        <div className="grid gap-7 lg:grid-cols-[0.35fr_1fr] lg:gap-12">
          <div className="lg:border-e lg:border-border lg:pe-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">05 / Boukir</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-foreground">{t('brandsTitle')}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{t('brandsDesc')}</p>
            <Link href={`/${locale}/shop`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-foreground underline decoration-primary decoration-2 underline-offset-8">{t('viewAll')}<ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} /></Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-px bg-border sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-none bg-background" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center border border-dashed border-border text-sm text-muted-foreground">{isError ? t('emptyBrands') : t('emptyBrands')}</div>
          ) : (
            <div className="grid grid-cols-3 gap-px bg-border sm:grid-cols-4 lg:grid-cols-6">
              {items.map((brand, index) => (
                <Link key={brand.id} href={`/${locale}/shop?brand_id=${encodeURIComponent(String(brand.id))}`} className={cn('group relative flex h-20 items-center justify-center overflow-hidden bg-background px-2 outline-none transition-colors hover:bg-muted/40 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary md:h-24 md:px-3', index > 11 && 'hidden md:flex')}>
                  <BrandLogo brand={brand} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function ProfessionalCatalog({ locale }: { locale: string }) {
  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <ProductGridSection locale={locale} />
      <DealsSection locale={locale} />
      <HomeCatalogHighlights locale={locale} className="bg-[#f2efe8] dark:bg-background" />
      <BrandsSection locale={locale} />
    </div>
  )
}

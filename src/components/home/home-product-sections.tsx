'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'
import { useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/shop/product-card'
import {
  useGetFeaturedPromoQuery,
  useGetNewArrivalsQuery,
} from '@/state/api/products-api-slice'
import type { ProductListItem } from '@/types/api/products'
import { normalizeLocale } from '@/i18n/locale'

function toProductCardModel(product: ProductListItem) {
  const currentPrice = product.prix_promo || product.prix_vente
  const hasDiscount = product.prix_promo && product.prix_promo < product.prix_vente

  return {
    id: product.id,
    name: product.designation,
    description: '',
    price: currentPrice,
    originalPrice: hasDiscount ? product.prix_vente : undefined,
    image: product.image_url || '',
    category: product.categorie?.nom || '',
    brand: product.brand?.nom,
    unit: product.base_unit,
    stock: product.quantite_disponible,
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
}: {
  title: string
  description?: string
  href: string
  products: ProductListItem[]
  isLoading: boolean
}) {
  const cardProducts = useMemo(() => products.map(toProductCardModel), [products])

  return (
    <section className="py-10">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm md:text-base text-muted-foreground">
                {description}
              </p>
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
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[280px] rounded-2xl border border-border/30 bg-card overflow-hidden"
              >
                <div className="h-[280px] bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted/70 animate-pulse rounded" />
                  <div className="h-4 bg-muted/50 animate-pulse rounded w-2/3" />
                  <div className="h-6 bg-muted/60 animate-pulse rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : cardProducts.length === 0 ? (
          <div className="border border-border/40 rounded-xl bg-card p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Aucun produit pour le moment.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {cardProducts.map((p) => (
              <div key={p.id} className="shrink-0 w-[280px]">
                <ProductCard product={p} viewMode="grid" />
              </div>
            ))}
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
      />
      <ProductRail
        title={newArrivalsTitle}
        description={newArrivalsDesc}
        href={`/${activeLocale}/shop?sort=newest`}
        products={newArrivals ?? []}
        isLoading={isNewLoading}
      />
    </div>
  )
}

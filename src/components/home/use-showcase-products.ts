"use client"

import { useMemo } from "react"

import { MIN_SHOWCASE_PRICE, showcaseProducts } from "@/lib/home/product-rotation"
import { useGetFeaturedPromoQuery, useGetNewArrivalsQuery, useGetProductsQuery } from "@/state/api/products-api-slice"
import type { ProductListItem } from "@/types/api/products"

/** How many catalogue products the homepage walls draw from. */
const CATALOGUE_POOL = 150

/**
 * The products worth showing on the homepage: a wide slice of the catalogue at MIN_SHOWCASE_PRICE and above,
 * plus promotions and new arrivals at the same level, each once, all with a photo.
 */
export function useShowcaseProducts() {
  const catalogue = useGetProductsQuery({ min_price: MIN_SHOWCASE_PRICE, per_page: CATALOGUE_POOL, page: 1, sort: "popular" })
  const promo = useGetFeaturedPromoQuery(40)
  const fresh = useGetNewArrivalsQuery(40)
  const products = useMemo<ProductListItem[]>(
    () => showcaseProducts([promo.data, catalogue.data?.products, fresh.data]),
    [promo.data, catalogue.data, fresh.data],
  )
  // Ready once each list answered (or failed): the walls are drawn once, not reshuffled as each list arrives.
  const ready = !catalogue.isLoading && !promo.isLoading && !fresh.isLoading
  return { products, ready }
}

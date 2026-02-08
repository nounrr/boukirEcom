"use client"

import type { ComponentProps } from "react"
import { ProductCard } from "@/components/shop/product-card"

type Props = Omit<ComponentProps<typeof ProductCard>, "layout">

export function ProductCardRow(props: Props) {
  return <ProductCard {...props} layout="row" />
}

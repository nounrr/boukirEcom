import type { Metadata } from "next"
import type React from "react"

import { buildPageMetadata } from "@/lib/seo/metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; id?: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const locale = resolvedParams?.locale
  const id = resolvedParams?.id

  return buildPageMetadata({
    locale,
    path: `/product/${id ?? ""}`,
    title: locale === "ar" ? "تفاصيل المنتج" : "Détails produit",
    description:
      locale === "ar"
        ? "صور، مواصفات، وحدات ومتغيرات المنتج. أضف إلى السلة واطلب أونلاين داخل المغرب."
        : "Photos, variantes, unités et fiche technique. Ajoutez au panier et commandez en ligne au Maroc.",
    indexable: true,
  })
}

export default function ProductDetailsRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

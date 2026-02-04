import type { Metadata } from "next"
import type React from "react"

import { buildPageMetadata } from "@/lib/seo/metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const locale = resolvedParams?.locale

  return buildPageMetadata({
    locale,
    path: "/wishlist",
    title: locale === "ar" ? "قائمة المفضلة" : "Mes favoris",
    description:
      locale === "ar"
        ? "احتفظ بمنتجاتك المفضلة للعثور عليها بسرعة لاحقًا."
        : "Retrouvez vos produits favoris pour les acheter plus tard.",
    indexable: false,
  })
}

export default function WishlistRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

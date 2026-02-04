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
    path: "/shop",
    title: locale === "ar" ? "المنتجات" : "Produits",
    description:
      locale === "ar"
        ? "تصفح كتالوج Boukir Diamond للدروجري ومواد التنظيف: فلترة حسب الفئة والعلامة التجارية والسعر. توصيل داخل المغرب ودفع آمن."
        : "Parcourez le catalogue Boukir Diamond (droguerie, entretien, hygiène) : filtres par catégorie, marque et prix. Livraison au Maroc et paiement sécurisé.",
    keywords:
      locale === "ar"
        ? ["دروجري", "مواد التنظيف", "منتجات منزلية", "منظفات", "المغرب", "Boukir Diamond"]
        : ["droguerie", "produits d'entretien", "hygiène", "nettoyage", "Maroc", "Boukir Diamond"],
    indexable: true,
  })
}

export default function ShopRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

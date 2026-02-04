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
    path: "/orders",
    title: locale === "ar" ? "طلباتي" : "Mes commandes",
    description:
      locale === "ar"
        ? "تتبع طلباتك وحالة الدفع والتوصيل."
        : "Suivez vos commandes, le paiement et l’état de livraison.",
    indexable: false,
  })
}

export default function OrdersRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

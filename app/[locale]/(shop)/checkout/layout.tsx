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
    path: "/checkout",
    title: locale === "ar" ? "إتمام الطلب" : "Commande",
    description:
      locale === "ar"
        ? "أكمل طلبك: معلومات الشحن، طريقة التوصيل، والدفع."
        : "Finalisez votre commande : informations de livraison, mode de livraison et paiement.",
    indexable: false,
  })
}

export default function CheckoutRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

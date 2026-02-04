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
    path: "/cart",
    title: locale === "ar" ? "سلة التسوق" : "Panier",
    description:
      locale === "ar"
        ? "راجع سلة التسوق الخاصة بك قبل إتمام الطلب."
        : "Consultez votre panier avant de finaliser votre commande.",
    indexable: false,
  })
}

export default function CartRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

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
    path: `/orders/${id ?? ""}`,
    title: locale === "ar" ? `تفاصيل الطلب ${id ?? ""}`.trim() : `Détails de la commande ${id ?? ""}`.trim(),
    description:
      locale === "ar"
        ? "اطلع على تفاصيل الطلب، الفاتورة، وحالة التوصيل والدفع."
        : "Consultez les détails de la commande, la facture, et l’état de livraison et de paiement.",
    indexable: false,
  })
}

export default function OrderDetailsRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

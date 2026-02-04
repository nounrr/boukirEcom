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
    path: "/profile",
    title: locale === "ar" ? "الملف الشخصي" : "Mon profil",
    description:
      locale === "ar"
        ? "قم بإدارة معلوماتك الشخصية وعناوين الشحن."
        : "Gérez vos informations personnelles et vos adresses de livraison.",
    indexable: false,
  })
}

export default function ProfileRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

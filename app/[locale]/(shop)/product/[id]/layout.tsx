import type { Metadata } from "next"
import type React from "react"

import { normalizeLocale } from "@/i18n/locale"
import { buildPageMetadata, getSiteUrl, localizedPath } from "@/lib/seo/metadata"
import { getProductForSeo, buildProductSeoText } from "@/lib/seo/product"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; id?: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const locale = normalizeLocale(resolvedParams?.locale)
  const id = resolvedParams?.id

  const product = await getProductForSeo(id)

  if (!product) {
    return buildPageMetadata({
      locale,
      path: `/product/${id ?? ""}`,
      title:
        locale === "ar"
          ? "المنتج غير موجود"
          : locale === "en"
            ? "Product not found"
            : locale === "zh"
              ? "未找到商品"
              : "Produit introuvable",
      description:
        locale === "ar"
          ? "تعذر العثور على هذا المنتج."
          : locale === "en"
            ? "We couldn't find this product."
            : locale === "zh"
              ? "无法找到该商品。"
              : "Nous n'avons pas trouvé ce produit.",
      indexable: false,
    })
  }

  const seo = buildProductSeoText({ product, locale })

  return buildPageMetadata({
    locale,
    path: `/product/${product.id}`,
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.metaKeywords,
    imageUrl: seo.imageUrl,
    openGraphType: "product",
    indexable: true,
  })
}

export default async function ProductDetailsRouteLayout({
  children,
  params,
}: {
  children: React.ReactNode
    params: Promise<{ locale?: string; id?: string }>
}) {
  const resolvedParams = await params
  const locale = normalizeLocale(resolvedParams?.locale)
  const id = resolvedParams?.id

  const product = await getProductForSeo(id)
  if (!product) return children

  const seo = buildProductSeoText({ product, locale })
  const productUrl = new URL(localizedPath(locale, `/product/${product.id}`), getSiteUrl()).toString()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: seo.productName,
    description: seo.metaDescription,
    image: seo.imageUrl ? [seo.imageUrl] : undefined,
    sku: String(product.id),
    brand: seo.brandName ? { "@type": "Brand", name: seo.brandName } : undefined,
    category: seo.categoryName || undefined,
    offers:
      seo.price != null
        ? {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: seo.currency,
          price: seo.price,
          availability: seo.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        }
        : undefined,
  }

  return (
    <>
      {children}
      <script
        type="application/ld+json"
        // JSON-LD is required to be a raw JSON string.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}

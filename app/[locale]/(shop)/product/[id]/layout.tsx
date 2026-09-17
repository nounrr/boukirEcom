import type { Metadata } from "next"
import type React from "react"
import Link from 'next/link'
import { productPath, productSlug } from '@/lib/seo/product-url'
import { catalogHref } from '@/lib/catalog/registry'

import { normalizeLocale } from "@/i18n/locale"
import { buildPageMetadata, localizedUrl, seoImageUrl } from "@/lib/seo/metadata"
import { getPublicProduct, buildProductSeoText } from "@/lib/seo/product"
import { hasLocalizedProductContent, productTranslationLocales } from '@/lib/seo/product-languages'
import { resolveProductOfferPrice } from '@/lib/product-price'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; id?: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const locale = normalizeLocale(resolvedParams?.locale)
  const id = resolvedParams?.id

  const result = await getPublicProduct(id)

  if (result.status !== 'found') {
    const text = {
      fr: { title: 'Produit introuvable | Boukir Diamond', description: "Nous n'avons pas trouvé ce produit." },
      ar: { title: 'المنتج غير موجود | بوكِير دايموند', description: 'تعذر العثور على هذا المنتج.' },
      en: { title: 'Product not found | Boukir Diamond', description: "We couldn't find this product." },
      zh: { title: '未找到商品 | Boukir Diamond', description: '无法找到该商品。' },
    }[locale]
    return {
      title: text.title,
      description: text.description,
      robots: { index: false, follow: true },
      // Replace inherited home alternates: an error URL is not canonical content.
      alternates: {},
    }
  }

  const product = result.product

  const seo = buildProductSeoText({ product, locale })
  const translatedLocales = productTranslationLocales(product)
  const hasTranslation = hasLocalizedProductContent(product, locale)

  const metadata = buildPageMetadata({
    locale,
    path: productPath(product, locale),
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.metaKeywords,
    imageUrl: seo.imageUrl,
    openGraphType: "product",
    indexable: hasTranslation,
  })
  metadata.alternates = {
    canonical: localizedUrl(locale, productPath(product, locale)),
    // A fallback page keeps its self-canonical URL but does not join a
    // hreflang cluster, so every advertised equivalent remains reciprocal.
    ...(hasTranslation ? {
      languages: Object.fromEntries(translatedLocales.map(l => [l, localizedUrl(l, productPath(product, l))])),
    } : {}),
  }
  return metadata
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

  const result = await getPublicProduct(id)
  if (result.status !== 'found') return children
  const product = result.product

  const seo = buildProductSeoText({ product, locale })
  const productUrl = localizedUrl(locale, productPath(product, locale))
  const imageUrl = seoImageUrl(seo.imageUrl)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: seo.productName,
    description: seo.metaDescription,
    image: imageUrl ? [imageUrl] : undefined,
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
          availability: seo.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        }
        : undefined,
  }

  const variants = product.variants || []
  const structuredData = variants.length ? {
    '@context': 'https://schema.org', '@type': 'ProductGroup',
    name: seo.productName, description: seo.metaDescription, url: productUrl,
    productGroupID: String(product.id), brand: jsonLd.brand,
    ...(variants.some(v => v.color_name) ? { variesBy: ['https://schema.org/color'] } : {}),
    hasVariant: variants.map(variant => {
      const label = variant.variant_name || String(variant.id)
      const url = `${productUrl}?variant=${encodeURIComponent(`${variant.id}-${productSlug({ id: variant.id, name: label }, locale)}`)}`
      const price = resolveProductOfferPrice(product, { variant }).price
      const image = seoImageUrl(variant.image_url) || imageUrl
      return { '@type': 'Product', name: `${seo.productName} — ${label}`,
        sku: `${product.id}-${variant.id}`, inProductGroupWithID: String(product.id), url,
        image: image ? [image] : undefined, color: variant.color_name || undefined,
        offers: price != null ? {
          '@type': 'Offer', url, price, priceCurrency: 'MAD',
          availability: variant.available === false ? 'https://schema.org/OutOfStock' : variant.available === true ? 'https://schema.org/InStock' : undefined,
        } : undefined,
      }
    }),
  } : jsonLd

  return (
    <>
      <nav className="container mx-auto px-6 pt-4 flex gap-4 text-sm" aria-label={locale === 'ar' ? 'الفئة والعلامة' : 'Catégorie et marque'}>
        {product.categorie?.id && <Link href={catalogHref(locale, 'categories', product.categorie.id)}>{locale === 'ar' ? product.categorie.nom_ar || product.categorie.nom : product.categorie.nom}</Link>}
        {product.brand?.id && <Link href={catalogHref(locale, 'marques', product.brand.id)}>{product.brand.nom}</Link>}
      </nav>
      {children}
      <script
        type="application/ld+json"
        // JSON-LD is required to be a raw JSON string.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
    </>
  )
}

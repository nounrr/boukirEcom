import { notFound, permanentRedirect } from 'next/navigation'
import { getProductForSeo } from '@/lib/seo/product'
import { productHref } from '@/lib/seo/product-url'
import { normalizeLocale } from '@/i18n/locale'
import ProductPageClient from './product-page-client'

export default async function ProductPage({ params, searchParams }: {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale: rawLocale, id } = await params
  const locale = normalizeLocale(rawLocale)
  const product = await getProductForSeo(id)
  if (!product) notFound()
  const target = productHref(product, locale)
  if (`/${locale}/product/${id}` !== target) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(await searchParams)) {
      if (Array.isArray(value)) value.forEach(v => query.append(key, v))
      else if (value !== undefined) query.set(key, value)
    }
    permanentRedirect(target + (query.size ? `?${query}` : ''))
  }
  return <ProductPageClient />
}

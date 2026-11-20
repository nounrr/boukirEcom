import Link from 'next/link'
import { productHref, productPath } from '@/lib/seo/product-url'
import type { CatalogKind, CatalogPage } from '@/lib/catalog/registry'
import { catalogHref, categories } from '@/lib/catalog/registry'
import type { ProductsListResponse } from '@/types/api/products'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import { catalogText, catalogCopy } from '@/lib/catalog/i18n'
import { getLocalizedProductName } from '@/lib/localized-fields'
import { isOutOfStockLike } from '@/lib/stock'
import { optimizedImageProps } from '@/lib/image-optimize'
import type { CategoryLink } from '@/lib/catalog/data'
import { localizedUrl } from '@/lib/seo/urls'
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo/site-json-ld'
import type { AppLocale } from '@/i18n/locale'

export function CatalogLanding({ kind, page, data, locale, pageNumber, parent = null, subcategories = [] }: { kind: CatalogKind; page: CatalogPage; data: ProductsListResponse; locale: string; pageNumber: number; parent?: CategoryLink | null; subcategories?: CategoryLink[] }) {
  const ar = locale === 'ar'
  const text = catalogText(page, locale)
  const t = catalogCopy(locale)
  const path = `/${locale}/${kind}/${page.slug}`
  const filter = new URLSearchParams({ [kind === 'categories' ? 'category_id' : 'brand_id']: String(page.id) })
  if (page.search) filter.set('search', page.search)
  const l = (locale in { fr: 1, ar: 1, en: 1, zh: 1 } ? locale : 'fr') as 'fr' | 'ar' | 'en' | 'zh'
  // Structured data matching the visible page: breadcrumb trail, and the products listed here.
  const trail = [
    { name: t.home, path: '/' },
    { name: t.shop, path: '/shop' },
    ...(parent ? [{ name: parent.name[l], path: `/${kind}/${parent.slug}` }] : []),
    { name: text.name, path: `/${kind}/${page.slug}` },
  ]
  const pageUrl = localizedUrl(locale as AppLocale, `/${kind}/${page.slug}${pageNumber > 1 ? `?page=${pageNumber}` : ''}`)
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${text.name} ${t.location}`,
    description: text.advice,
    url: pageUrl,
    inLanguage: locale,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.pagination.total_items,
      itemListElement: data.products.map((product, index) => ({
        '@type': 'ListItem',
        position: (pageNumber - 1) * data.pagination.per_page + index + 1,
        url: localizedUrl(locale as AppLocale, productPath(product, locale)),
        name: getLocalizedProductName(product, locale),
      })),
    },
  }
  return <main className="container mx-auto px-6 py-10" dir={ar ? 'rtl' : 'ltr'}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(locale as AppLocale, trail)) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(collection) }} />
    <nav aria-label={t.breadcrumb} className="mb-5 text-sm"><Link href={`/${locale}`}>{t.home}</Link> / <Link href={`/${locale}/shop`}>{t.shop}</Link>{parent ? <> / <Link href={`/${locale}/${kind}/${parent.slug}`}>{parent.name[l]}</Link></> : null} / <span aria-current="page">{text.name}</span></nav>
    <h1 className="text-3xl font-bold mb-4">{text.name} {t.location}{pageNumber > 1 ? ` — ${t.page} ${pageNumber}` : ''}</h1>
    <p className="max-w-3xl text-muted-foreground leading-7 mb-6">{text.advice}</p>
    {subcategories.length > 0 ? <nav aria-label={t.subcategories} className="mb-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">{t.subcategories}</h2>
      <ul className="flex flex-wrap gap-2">{subcategories.map(sub => <li key={sub.slug}><Link className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold transition-colors hover:border-primary/50 hover:text-accent-text" href={`/${locale}/${kind}/${sub.slug}`}>{sub.name[l]}</Link></li>)}</ul>
    </nav> : null}
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8"><p>{data.pagination.total_items} {t.count}</p><Link className="underline" href={`/${locale}/shop?${filter}`}>{t.refine}</Link></div>
    {data.products.length === 0 ? <p role="status">{t.empty}</p> :
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">{data.products.map(product => <li key={product.id} className="rounded-xl border p-4 bg-card">
        <Link href={productHref(product, locale)} className="block font-semibold">
          {toAbsoluteImageUrl(product.image_url) && <img {...optimizedImageProps(toAbsoluteImageUrl(product.image_url)!, 280)} alt="" loading="lazy" decoding="async" width={280} height={280} className="mb-4 w-full aspect-square object-contain" />}
          <h2>{getLocalizedProductName(product, locale)}{product.is_obligatoire_variant && product.variants?.all?.[0]?.variant_name
            ? ` • ${product.variants.all[0].variant_name}` : ''}</h2>
        </Link>
        <p className="mt-3">{Number(product.prix_promo || product.prix_vente) > 0 ? `${Number(product.prix_promo || product.prix_vente).toFixed(2)} ${t.currency}` : t.price}</p>
        {product.base_unit && <p className="text-sm text-muted-foreground">{t.unit}: {product.base_unit}</p>}
        <p className={`text-sm ${isOutOfStockLike(product) ? 'text-red-700' : 'text-emerald-700'}`}>{isOutOfStockLike(product) ? t.outOfStock : t.inStock}</p>
        {product.brand && <Link className="text-sm underline" href={catalogHref(locale, 'marques', product.brand.id)}>{product.brand.nom}</Link>}
      </li>)}</ul>}
    <nav aria-label={t.pagination} className="flex gap-8 my-8">
      {pageNumber > 1 && <Link href={pageNumber === 2 ? path : `${path}?page=${pageNumber - 1}`}>{t.previous}</Link>}
      {data.pagination.has_next && <Link href={`${path}?page=${pageNumber + 1}`}>{t.next}</Link>}
    </nav>
    <section className="border-t pt-6"><h2 className="text-xl font-semibold mb-4">{t.related}</h2><ul className="flex flex-wrap gap-4">{categories.filter(c => c.slug !== page.slug).map(c => <li key={c.slug}><Link className="underline" href={`/${locale}/categories/${c.slug}`}>{catalogText(c, locale).name}</Link></li>)}</ul></section>
  </main>
}

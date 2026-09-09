import Link from 'next/link'
import type { CatalogKind, CatalogPage } from '@/lib/catalog/registry'
import { catalogHref, categories } from '@/lib/catalog/registry'
import type { ProductsListResponse } from '@/types/api/products'
import { toAbsoluteImageUrl } from '@/lib/image-url'

export function CatalogLanding({ kind, page, data, locale, pageNumber }: { kind: CatalogKind; page: CatalogPage; data: ProductsListResponse; locale: string; pageNumber: number }) {
  const ar = locale === 'ar'
  const path = `/${locale}/${kind}/${page.slug}`
  const filter = new URLSearchParams({ [kind === 'categories' ? 'category_id' : 'brand_id']: String(page.id) })
  if (page.search) filter.set('search', page.search)
  return <main className="container mx-auto px-6 py-10" dir={ar ? 'rtl' : 'ltr'}>
    <nav aria-label={ar ? 'مسار التصفح' : 'Fil d’Ariane'} className="mb-5 text-sm"><Link href={`/${locale}`}>{ar ? 'الرئيسية' : 'Accueil'}</Link> / <Link href={`/${locale}/shop`}>{ar ? 'المتجر' : 'Boutique'}</Link></nav>
    <h1 className="text-3xl font-bold mb-4">{ar ? page.ar : page.fr} {ar ? 'في طنجة' : 'à Tanger'}{pageNumber > 1 ? ` — ${ar ? 'صفحة' : 'page'} ${pageNumber}` : ''}</h1>
    <p className="max-w-3xl text-muted-foreground leading-7 mb-6">{ar ? page.adviceAr : page.adviceFr}</p>
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8"><p>{data.pagination.total_items} {ar ? 'منتج في الكتالوج' : 'produits au catalogue'}</p><Link className="underline" href={`/${locale}/shop?${filter}`}>{ar ? 'تصفية حسب السعر والعلامة والخصائص' : 'Affiner par prix, marque et caractéristiques'}</Link></div>
    {data.products.length === 0 ? <p role="status">{ar ? 'لا توجد منتجات متاحة في هذه الفئة حالياً.' : 'Aucun produit disponible dans cette sélection pour le moment.'}</p> :
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">{data.products.map(product => <li key={product.id} className="rounded-xl border p-4 bg-card">
        <Link href={`/${locale}/product/${product.id}`} className="block font-semibold">
          {toAbsoluteImageUrl(product.image_url) && <img src={toAbsoluteImageUrl(product.image_url)!} alt="" loading="lazy" width={280} height={280} className="mb-4 w-full aspect-square object-contain" />}
          <h2>{ar ? product.designation_ar || product.designation : product.designation}</h2>
        </Link>
        <p className="mt-3">{Number(product.prix_promo || product.prix_vente) > 0 ? `${Number(product.prix_promo || product.prix_vente).toFixed(2)} ${ar ? 'درهم' : 'MAD'}` : ar ? 'استفسر عن السعر' : 'Prix à confirmer'}</p>
        {product.brand && <Link className="text-sm underline" href={catalogHref(locale, 'marques', product.brand.id)}>{product.brand.nom}</Link>}
      </li>)}</ul>}
    <nav aria-label={ar ? 'صفحات المنتجات' : 'Pagination des produits'} className="flex gap-8 my-8">
      {pageNumber > 1 && <Link href={pageNumber === 2 ? path : `${path}?page=${pageNumber - 1}`}>{ar ? 'السابق' : 'Précédent'}</Link>}
      {data.pagination.has_next && <Link href={`${path}?page=${pageNumber + 1}`}>{ar ? 'التالي' : 'Suivant'}</Link>}
    </nav>
    <section className="border-t pt-6"><h2 className="text-xl font-semibold mb-4">{ar ? 'أقسام مرتبطة بمشروعك' : 'Préparer votre chantier'}</h2><ul className="flex flex-wrap gap-4">{categories.filter(c => c.slug !== page.slug).map(c => <li key={c.slug}><Link className="underline" href={`/${locale}/categories/${c.slug}`}>{ar ? c.ar : c.fr}</Link></li>)}</ul></section>
  </main>
}

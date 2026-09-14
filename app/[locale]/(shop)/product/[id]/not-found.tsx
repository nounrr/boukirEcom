import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

import { normalizeLocale } from '@/i18n/locale'
import { catalogText } from '@/lib/catalog/i18n'
import { categories } from '@/lib/catalog/registry'

export default async function ProductNotFound() {
  const locale = normalizeLocale(await getLocale())
  const t = await getTranslations({ locale, namespace: 'notFound' })
  const suggested = categories.filter(category => ['73-matieres-de-construction', '75-etancheite-bitume', '48-outillage-carreleur'].includes(category.slug))

  return (
    <section className="container mx-auto px-6 py-16 text-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-3 text-3xl font-bold text-foreground">{t('product.title')}</h1>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t('product.description')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground" href={`/${locale}/shop`}>
          {t('product.primaryLabel')}
        </Link>
        <Link className="rounded-lg border px-5 py-3 font-medium" href={`/${locale}`}>
          {t('default.primaryLabel')}
        </Link>
      </div>
      <nav className="mt-10" aria-label={t('product.primaryLabel')}>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {suggested.map(category => (
            <li key={category.slug}>
              <Link className="underline underline-offset-4" href={`/${locale}/categories/${category.slug}`}>
                {catalogText(category, locale).name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}

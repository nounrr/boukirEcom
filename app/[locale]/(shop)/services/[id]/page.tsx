import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { ServiceCover } from '@/components/services/service-cover'
import { CompatibleMaalemCard } from '@/components/services/compatible-maalem-card'
import { Button } from '@/components/ui/button'
import { normalizeLocale } from '@/i18n/locale'
import { catalogueHref, localizedCategoryName, localizedServiceText, quickServiceRequestHref, serviceRequestHref } from '@/lib/service-catalog'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import { getActiveService, getCompatibleServiceMaalems } from '@/lib/service-requests'
import { buildPageMetadata, localizedUrl, seoImageUrl } from '@/lib/seo/metadata'

type Props = { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ page?: string | string[] }> }
const positive = (value: string | undefined) => { const number = Number(value); return Number.isSafeInteger(number) && number > 0 ? number : null }

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale: rawLocale, id: rawId } = await params
  const locale = normalizeLocale(rawLocale)
  const id = positive(rawId)
  if (!id) return {}
  try {
    const [service, t] = await Promise.all([getActiveService(id), getTranslations({ locale, namespace: 'serviceDetailPage' })])
    const localized = localizedServiceText(service, locale)
    return buildPageMetadata({ locale, title: localized.name, description: t('metadataDescription', { service: localized.name }), path: `/services/${id}`, imageUrl: toAbsoluteImageUrl(service.image_url) })
  } catch { return {} }
}

export default async function ServiceDetailPage({ params, searchParams }: Props) {
  const [{ locale: rawLocale, id: rawId }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const id = positive(rawId)
  if (!id) notFound()
  const pageValue = Array.isArray(query.page) ? query.page[0] : query.page
  const page = positive(pageValue) || 1
  let service
  try { service = await getActiveService(id) } catch { notFound() }
  const t = await getTranslations({ locale, namespace: 'serviceDetailPage' })
  const localized = localizedServiceText(service, locale)
  let compatible = null
  try { compatible = await getCompatibleServiceMaalems(id, page, 6) } catch { /* retain service detail */ }
  const image = toAbsoluteImageUrl(service.image_url)
  const pagination = compatible?.pagination
  const href = (target: number) => catalogueHref(locale, { page: target }).replace('/services', `/services/${id}`)
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Service', name: localized.name, description: localized.description || t('jsonLdDescription'), image: seoImageUrl(image) || undefined, provider: { '@type': 'Organization', name: 'Boukir Diamond' }, url: localizedUrl(locale, `/services/${id}`) }

  return <div className="bg-[#fbf8ef] dark:bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href={`/${locale}/services`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30"><ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />{t('back')}</Link>

      <header className="max-w-3xl pb-8 pt-5 sm:pb-10">
        <p className="text-sm text-muted-foreground">{t('eyebrow')}</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{localized.name}</h1>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground" aria-label={t('categories')}>{service.categories.map((category) => <span key={category.id}>{localizedCategoryName(category, locale)}</span>)}</div>
      </header>
      <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="min-w-0">
          <ServiceCover src={image} name={localized.name} />
          <p className="mt-7 max-w-3xl whitespace-pre-wrap text-base leading-8 text-muted-foreground">{localized.description}</p>
        </div>
        <aside className="border-y border-border py-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-medium">{t('requestService')}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('assuranceText')}</p>
          <Button asChild className="mt-6 h-auto min-h-12 w-full whitespace-normal rounded-md bg-amber-400 px-4 py-3 text-emerald-950 hover:bg-amber-300 dark:bg-amber-400 dark:text-emerald-950"><Link href={serviceRequestHref(locale, id)}>{t('requestService')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button>
          <Button asChild variant="ghost" className="mt-2 h-auto min-h-11 w-full whitespace-normal rounded-md text-muted-foreground"><Link href={quickServiceRequestHref(locale)}>{t('quickRequest')}</Link></Button>
          <p className="mt-5 flex items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-800 dark:text-emerald-400" aria-hidden="true" />{t('assuranceTitle')}</p>
        </aside>
      </section>

      <section className="mt-12" aria-labelledby="compatible-maalems"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5"><div><h2 id="compatible-maalems" className="text-2xl font-medium tracking-tight">{t('maalemsTitle')}</h2>{pagination && <p className="mt-1 text-sm text-muted-foreground">{t('maalemsCount', { count: pagination.total_items })}</p>}<p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{t('availabilityNotice')}</p></div></div>
        {!compatible ? <div className="mt-6 border border-destructive/20 bg-card p-8 text-center"><h3 className="font-semibold">{t('errorTitle')}</h3><Button asChild variant="outline" className="mt-4"><Link href={href(page)}>{t('page', { page })}</Link></Button></div> : compatible.maalems.length === 0 ? <div className="mt-6 border border-dashed border-border bg-card p-8 text-center"><h3 className="text-xl font-semibold">{t('emptyTitle')}</h3><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t('emptyText')}</p><Button asChild className="mt-5"><Link href={serviceRequestHref(locale, id)}>{t('requestService')}</Link></Button></div> : <div className="mt-2 grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">{compatible.maalems.map((maalem) => <CompatibleMaalemCard key={maalem.id} maalem={maalem} locale={locale} serviceId={id} labels={{ verified: t('verified'), city: t('city'), areas: t('areas'), missions: t('missions', { count: maalem.closed_interventions_for_service }), profile: t('profile'), choose: t('choose'), rating: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verifiedReviews: t('verifiedReviews'), noReviews: t('noReviews') }} />)}</div>}
        {pagination && pagination.total_pages > 1 && <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t('pagination')}><Button asChild variant="outline" className={!pagination.has_previous ? 'pointer-events-none opacity-50' : ''}><Link href={href(Math.max(1, page - 1))} aria-disabled={!pagination.has_previous}><ArrowLeft className="size-4 rtl:rotate-180" />{t('previous')}</Link></Button><span className="text-sm font-semibold">{t('page', { page: pagination.current_page })}</span><Button asChild variant="outline" className={!pagination.has_next ? 'pointer-events-none opacity-50' : ''}><Link href={href(page + 1)} aria-disabled={!pagination.has_next}>{t('next')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button></nav>}
      </section>

      <aside className="mt-12 grid gap-5 border-y border-border py-8 sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="text-xl font-semibold">{t('quickRequest')}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t('emptyText')}</p></div><Button asChild variant="outline" className="min-h-11 rounded-md"><Link href={quickServiceRequestHref(locale)}>{t('quickRequest')}</Link></Button></aside>
    </div>
    <div className="sticky bottom-0 z-30 border-t border-border bg-background p-3  lg:hidden"><Button asChild className="min-h-12 w-full rounded-md bg-amber-400 text-emerald-950 hover:bg-amber-300 dark:bg-amber-400"><Link href={serviceRequestHref(locale, id)}>{t('requestService')}</Link></Button></div>
  </div>
}

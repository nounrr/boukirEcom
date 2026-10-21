import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Layers, ShieldCheck, Users, Wrench } from 'lucide-react'
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

/** Meme systeme visuel que la fiche Maalem. */
const CARD = 'rounded-[1.75rem] border border-stone-200/80 bg-white dark:border-white/10 dark:bg-card'
/** Largeur : pleine sur portable et laptop, 90 % sur tres grand ecran. */
const SHELL = 'mx-auto w-full max-w-[88rem] px-4 sm:px-6 lg:px-10'
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
  const returnTo = `/${locale}/services/${id}${page > 1 ? `?page=${page}` : ''}`
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

  const quickStats = [
    pagination ? { icon: Users, value: pagination.total_items, label: t('maalemsTitle'), surface: 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40', iconTone: 'text-sky-700 dark:text-sky-300' } : null,
    service.categories.length ? { icon: Layers, value: service.categories.length, label: t('categories'), surface: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40', iconTone: 'text-emerald-700 dark:text-emerald-300' } : null,
  ].filter(Boolean) as Array<{ icon: typeof Users; value: number; label: string; surface: string; iconTone: string }>

  return <main className="bg-[#fcfdfa] dark:bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

    <div className={`${SHELL} pb-28 pt-5 sm:pt-7 lg:pb-16`}>
      <Link href={`/${locale}/services`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />{t('back')}
      </Link>

      <div className="mt-8 grid items-start gap-9 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-card">
            <div className="flex min-w-0 items-start gap-4 lg:flex-col-reverse">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">{t('eyebrow')}</p>
                <h1 className="mt-2 break-words text-[clamp(1.7rem,4vw,2.3rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-stone-950 dark:text-white">{localized.name}</h1>
              </div>
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-emerald-950 lg:size-40">
                <ServiceCover src={image} name={localized.name} variant="thumb" />
              </div>
            </div>
            {service.categories.length > 0 && <ul className="mt-5 flex flex-wrap gap-2 border-t border-stone-200 pt-5 dark:border-white/10" aria-label={t('categories')}>
              {service.categories.map((category) => <li key={category.id} className="rounded-md border border-stone-200 bg-[#f5f2eb] px-2.5 py-1 text-xs font-medium text-stone-800 dark:border-white/15 dark:bg-stone-900 dark:text-stone-200">{localizedCategoryName(category, locale)}</li>)}
            </ul>}
          </div>
          <div className="mt-3 rounded-[1.5rem] bg-emerald-950 p-5 text-white dark:bg-emerald-900">
            <h2 className="text-base font-semibold text-white">{t('requestService')}</h2>
            <Button asChild size="lg" className="mt-5 hidden h-auto min-h-12 w-full whitespace-normal rounded-xl bg-white px-4 py-3 text-center font-semibold text-emerald-950 hover:bg-stone-100 lg:inline-flex">
              <Link href={serviceRequestHref(locale, id)}>{t('requestService')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link>
            </Button>
            <Link href={quickServiceRequestHref(locale, returnTo)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/30 px-4 py-2 text-center text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 motion-reduce:transition-none">{t('quickRequest')}</Link>
            <p className="mt-4 flex items-start gap-2 border-t border-white/20 pt-4 text-xs leading-5 text-emerald-100"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t('assuranceTitle')}</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          <section className="border-b border-stone-300 pb-8 dark:border-white/15" aria-label={t('eyebrow')}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">{t('eyebrow')}</p>
            {localized.description && <p className="mt-4 whitespace-pre-wrap break-words text-lg leading-8 text-stone-900 dark:text-stone-100">{localized.description}</p>}
            <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4 border-t border-stone-200 pt-5 dark:border-white/10">
              {quickStats.map((stat) => <div key={stat.label} className="min-w-[8rem]"><dt className="text-xs text-stone-600 dark:text-stone-300">{stat.label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-emerald-950 dark:text-white">{stat.value}</dd></div>)}
            </dl>
          </section>
          {/* ── Compatibilite verifiee ── */}
          <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-6 shadow-[0_18px_40px_-36px_rgba(4,90,64,.7)] sm:p-8 dark:border-emerald-800 dark:bg-emerald-950/40" aria-labelledby="assurance-heading">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white dark:bg-emerald-600" aria-hidden="true"><ShieldCheck className="size-6" /></span>
              <div className="min-w-0">
                <h2 id="assurance-heading" className="text-xl font-semibold tracking-tight text-emerald-950 dark:text-white">{t('assuranceTitle')}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-200">{t('assuranceText')}</p>
              </div>
            </div>
            <Link href={quickServiceRequestHref(locale, returnTo)} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-emerald-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 lg:hidden dark:text-emerald-300">{t('quickRequest')}</Link>
          </section>

          {/* ── Maalems compatibles ── */}
          <section id="maalems" className="scroll-mt-24" aria-labelledby="compatible-maalems">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200" aria-hidden="true"><Users className="size-5" /></span>
              <div>
                <h2 id="compatible-maalems" className="text-xl font-semibold tracking-tight">{t('maalemsTitle')}</h2>
                {pagination && <p className="mt-0.5 text-sm text-muted-foreground">{t('maalemsCount', { count: pagination.total_items })}</p>}
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t('availabilityNotice')}</p>

            {!compatible ? (
              <div className={`${CARD} mt-6 p-8 text-center`}>
                <h3 className="font-semibold">{t('errorTitle')}</h3>
                <Button asChild variant="outline" className="mt-4 rounded-full"><Link href={href(page)}>{t('page', { page })}</Link></Button>
              </div>
            ) : compatible.maalems.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-black/10 p-8 text-center dark:border-white/15">
                <h3 className="text-xl font-semibold">{t('emptyTitle')}</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t('emptyText')}</p>
                <Button asChild className="mt-5 h-11 rounded-full bg-emerald-900 px-6 text-white hover:bg-emerald-800 dark:bg-emerald-700">
                  <Link href={serviceRequestHref(locale, id)}>{t('requestService')}</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {compatible.maalems.map((maalem) => (
                  <CompatibleMaalemCard key={maalem.id} maalem={maalem} locale={locale} serviceId={id} labels={{ verified: t('verified'), city: t('city'), areas: t('areas'), missions: t('missions', { count: maalem.closed_interventions_for_service }), profile: t('profile'), choose: t('choose'), rating: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verifiedReviews: t('verifiedReviews'), noReviews: t('noReviews') }} />
                ))}
              </div>
            )}

            {pagination && pagination.total_pages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t('pagination')}>
                {pagination.has_previous ? <Button asChild variant="outline" className="h-11 rounded-full border-black/10 px-5 dark:border-white/15"><Link href={href(page - 1)}><ArrowLeft className="size-4 rtl:rotate-180" />{t('previous')}</Link></Button> : <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 px-5 text-sm text-muted-foreground/70 dark:border-white/15" aria-disabled="true"><ArrowLeft className="size-4 rtl:rotate-180" />{t('previous')}</span>}
                <span className="text-sm font-medium text-muted-foreground">{t('page', { page: pagination.current_page })}</span>
                {pagination.has_next ? <Button asChild variant="outline" className="h-11 rounded-full border-black/10 px-5 dark:border-white/15"><Link href={href(page + 1)}>{t('next')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button> : <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 px-5 text-sm text-muted-foreground/70 dark:border-white/15" aria-disabled="true">{t('next')}<ArrowRight className="size-4 rtl:rotate-180" /></span>}
              </nav>
            )}
          </section>
        </div>
      </div>
    </div>

    {/* Mobile conversion bar */}
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.08] bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden dark:border-white/10 dark:bg-background">
      <Button asChild className="h-auto min-h-12 w-full whitespace-normal rounded-full bg-emerald-900 px-4 py-3 text-center font-medium text-white hover:bg-emerald-800 dark:bg-emerald-700">
        <Link href={serviceRequestHref(locale, id)}>{t('requestService')}</Link>
      </Button>
    </div>
  </main>
}

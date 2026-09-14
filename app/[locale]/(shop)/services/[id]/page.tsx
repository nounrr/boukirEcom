import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Layers, ShieldCheck, Users } from 'lucide-react'
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
const CARD = 'rounded-3xl border border-black/[0.06] bg-white shadow-[0_2px_14px_-10px_rgba(16,24,40,.25)] dark:border-white/10 dark:bg-card'
/** Largeur : pleine sur portable et laptop, 90 % sur tres grand ecran. */
const SHELL = 'mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:w-[90%]'
/** Seule difference avec la fiche Maalem : la teinte du degrade. */
const BANNER = 'bg-gradient-to-r from-sky-200 via-violet-100 to-amber-200 dark:from-sky-900/50 dark:via-violet-950/60 dark:to-amber-900/40'
const BANNER_STRIP = 'bg-gradient-to-r from-sky-500 via-violet-400 to-amber-300'

const TONES = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
} as const

function SectionIcon({ icon: Icon, tone }: { icon: typeof Users; tone: keyof typeof TONES }) {
  return (
    <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${TONES[tone]}`} aria-hidden="true">
      <Icon className="size-5" />
    </span>
  )
}

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

  const quickStats = [
    pagination ? { icon: Users, value: pagination.total_items, label: t('maalemsTitle'), color: 'text-sky-700 dark:text-sky-400' } : null,
    service.categories.length ? { icon: Layers, value: service.categories.length, label: t('categories'), color: 'text-violet-700 dark:text-violet-400' } : null,
  ].filter(Boolean) as Array<{ icon: typeof Users; value: number; label: string; color: string }>

  return <main className="bg-white dark:bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

    <div className={`${SHELL} pb-16 pt-5 sm:pt-7`}>
      <Link href={`/${locale}/services`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />{t('back')}
      </Link>

      {/* ── Hero service : banniere degradee + visuel en debord ── */}
      <header className="mt-3">
        <div className={`h-32 w-full rounded-3xl sm:h-44 ${BANNER}`} aria-hidden="true" />

        <div className="-mt-14 px-2 sm:-mt-20 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-10">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-[28px] border-4 border-white bg-neutral-100 shadow-[0_10px_30px_-16px_rgba(16,24,40,.5)] sm:size-40 dark:border-card dark:bg-neutral-800">
              <ServiceCover src={image} name={localized.name} variant="thumb" />
            </div>

            <div className="min-w-0 flex-1 lg:pb-1">
              <p className="text-sm text-muted-foreground">{t('eyebrow')}</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{localized.name}</h1>
              {service.categories.length > 0 && (
                <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label={t('categories')}>
                  {service.categories.map((category) => (
                    <li key={category.id} className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                      {localizedCategoryName(category, locale)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {quickStats.length > 0 && (
              <dl className="flex flex-wrap gap-x-8 gap-y-4 lg:justify-end lg:pb-1">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="min-w-20">
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <stat.icon className={`size-3.5 ${stat.color}`} aria-hidden="true" />{stat.label}
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {localized.description && (
            <p className="mt-6 max-w-3xl whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{localized.description}</p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-emerald-900 px-7 text-base font-medium text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600">
              <Link href={serviceRequestHref(locale, id)}>{t('requestService')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-black/10 bg-white px-7 text-base font-medium text-foreground hover:bg-neutral-50 dark:border-white/15 dark:bg-transparent dark:hover:bg-white/10">
              <Link href={quickServiceRequestHref(locale)}>{t('quickRequest')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
        <div className="min-w-0 space-y-8">

          {/* ── Compatibilite verifiee ── */}
          <section className={`${CARD} p-6 sm:p-8`} aria-labelledby="assurance-heading">
            <div className="flex items-start gap-4">
              <SectionIcon icon={ShieldCheck} tone="emerald" />
              <div className="min-w-0">
                <h2 id="assurance-heading" className="text-xl font-semibold tracking-tight">{t('assuranceTitle')}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('assuranceText')}</p>
              </div>
            </div>
          </section>

          {/* ── Maalems compatibles ── */}
          <section id="maalems" className="scroll-mt-24" aria-labelledby="compatible-maalems">
            <div className="flex items-center gap-3">
              <SectionIcon icon={Users} tone="sky" />
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
              <div className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {compatible.maalems.map((maalem) => (
                  <CompatibleMaalemCard key={maalem.id} maalem={maalem} locale={locale} serviceId={id} labels={{ verified: t('verified'), city: t('city'), areas: t('areas'), missions: t('missions', { count: maalem.closed_interventions_for_service }), profile: t('profile'), choose: t('choose'), rating: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verifiedReviews: t('verifiedReviews'), noReviews: t('noReviews') }} />
                ))}
              </div>
            )}

            {pagination && pagination.total_pages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t('pagination')}>
                <Button asChild variant="outline" className={`h-11 rounded-full border-black/10 px-5 dark:border-white/15 ${!pagination.has_previous ? 'pointer-events-none opacity-50' : ''}`}>
                  <Link href={href(Math.max(1, page - 1))} aria-disabled={!pagination.has_previous}><ArrowLeft className="size-4 rtl:rotate-180" />{t('previous')}</Link>
                </Button>
                <span className="text-sm font-medium text-muted-foreground">{t('page', { page: pagination.current_page })}</span>
                <Button asChild variant="outline" className={`h-11 rounded-full border-black/10 px-5 dark:border-white/15 ${!pagination.has_next ? 'pointer-events-none opacity-50' : ''}`}>
                  <Link href={href(page + 1)} aria-disabled={!pagination.has_next}>{t('next')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
                </Button>
              </nav>
            )}
          </section>
        </div>

        {/* ── Sticky conversion rail ── */}
        <aside className="lg:sticky lg:top-24">
          <div className={`${CARD} overflow-hidden`}>
            <div className={`h-2 w-full ${BANNER_STRIP}`} aria-hidden="true" />
            <div className="p-6">
              <h2 className="text-lg font-semibold leading-snug">{t('requestService')}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('assuranceText')}</p>
              <Button asChild size="lg" className="mt-6 h-auto min-h-12 w-full whitespace-normal rounded-full bg-emerald-900 px-4 py-3 font-medium text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                <Link href={serviceRequestHref(locale, id)}>{t('requestService')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="mt-3 h-auto min-h-12 w-full whitespace-normal rounded-full border-black/10 bg-white text-foreground hover:bg-neutral-50 dark:border-white/15 dark:bg-transparent dark:hover:bg-white/10">
                <Link href={quickServiceRequestHref(locale)}>{t('quickRequest')}</Link>
              </Button>
              <p className="mt-5 flex items-start gap-2 border-t border-black/[0.06] pt-4 text-xs leading-5 text-muted-foreground dark:border-white/10">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />{t('assuranceTitle')}
              </p>
            </div>
          </div>

          <div className={`${CARD} mt-6 p-6`}>
            <h2 className="text-sm font-semibold text-foreground">{t('quickRequest')}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('emptyText')}</p>
            <Button asChild variant="outline" className="mt-4 h-11 w-full rounded-full border-black/10 dark:border-white/15">
              <Link href={quickServiceRequestHref(locale)}>{t('quickRequest')}</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>

    {/* Mobile conversion bar */}
    <div className="sticky bottom-0 z-30 border-t border-black/[0.08] bg-white p-3 lg:hidden dark:border-white/10 dark:bg-background/95">
      <Button asChild className="min-h-12 w-full rounded-full bg-emerald-900 font-medium text-white hover:bg-emerald-800 dark:bg-emerald-700">
        <Link href={serviceRequestHref(locale, id)}>{t('requestService')}</Link>
      </Button>
    </div>
  </main>
}

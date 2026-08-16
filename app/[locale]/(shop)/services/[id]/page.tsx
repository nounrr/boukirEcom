import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ImageIcon, ShieldCheck, Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { CompatibleMaalemCard } from '@/components/services/compatible-maalem-card'
import { Button } from '@/components/ui/button'
import { normalizeLocale } from '@/i18n/locale'
import { catalogueHref, localizedCategoryName, localizedServiceText, quickServiceRequestHref, serviceRequestHref } from '@/lib/service-catalog'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import { getActiveService, getCompatibleServiceMaalems } from '@/lib/service-requests'
import { buildPageMetadata } from '@/lib/seo/metadata'

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
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Service', name: localized.name, description: localized.description || t('jsonLdDescription'), image: image || undefined, provider: { '@type': 'Organization', name: 'Boukir Diamond' }, url: `/${locale}/services/${id}` }

  return <div className="bg-[#fbf8f0] dark:bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href={`/${locale}/services`} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />{t('back')}</Link>
      <nav aria-label="Breadcrumb" className="mt-3 text-xs text-muted-foreground"><Link href={`/${locale}/services`} className="hover:text-foreground">{t('back')}</Link><span className="mx-2">/</span><span aria-current="page">{localized.name}</span></nav>

      <section className="mt-6 grid overflow-hidden border border-amber-200 bg-card shadow-[0_26px_65px_-44px_rgba(66,48,17,.8)] lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative min-h-72 bg-muted sm:min-h-[28rem]">{image ? <Image src={image} alt={localized.name} fill priority sizes="(max-width:1023px) 100vw,55vw" className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-100 to-[#fffdf7]" role="img" aria-label={localized.name}><ImageIcon className="size-16 text-amber-700/45" /></div>}</div>
        <div className="flex flex-col p-6 sm:p-9 lg:p-12"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-amber-800"><Sparkles className="size-4" />{t('eyebrow')}</p><h1 className="mt-4 text-4xl font-black tracking-[-.035em] sm:text-5xl">{localized.name}</h1><div className="mt-5 flex flex-wrap gap-2" aria-label={t('categories')}>{service.categories.map((category) => <span key={category.id} className="border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900">{localizedCategoryName(category, locale)}</span>)}</div><p className="mt-6 whitespace-pre-wrap text-base leading-8 text-muted-foreground">{localized.description}</p><div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2"><Button asChild size="lg" className="min-h-12"><Link href={serviceRequestHref(locale, id)}>{t('requestService')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button><Button asChild size="lg" variant="outline" className="min-h-12"><Link href={quickServiceRequestHref(locale)}>{t('quickRequest')}</Link></Button></div></div>
      </section>

      <aside className="mt-8 flex items-start gap-4 border-s-4 border-emerald-600 bg-emerald-50 p-5 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100"><ShieldCheck className="mt-0.5 size-6 shrink-0" /><div><h2 className="font-bold">{t('assuranceTitle')}</h2><p className="mt-1 text-sm leading-6 opacity-80">{t('assuranceText')}</p></div></aside>

      <section className="mt-12" aria-labelledby="compatible-maalems"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground/10 pb-5"><div><h2 id="compatible-maalems" className="text-3xl font-black tracking-tight">{t('maalemsTitle')}</h2>{pagination && <p className="mt-1 text-sm text-muted-foreground">{t('maalemsCount', { count: pagination.total_items })}</p>}</div></div>
        {!compatible ? <div className="mt-6 border border-destructive/20 bg-card p-8 text-center"><h3 className="font-bold">{t('errorTitle')}</h3><Button asChild variant="outline" className="mt-4"><Link href={href(page)}>{t('page', { page })}</Link></Button></div> : compatible.maalems.length === 0 ? <div className="mt-6 border border-dashed border-amber-300 bg-card p-8 text-center"><h3 className="text-xl font-bold">{t('emptyTitle')}</h3><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t('emptyText')}</p><Button asChild className="mt-5"><Link href={serviceRequestHref(locale, id)}>{t('requestService')}</Link></Button></div> : <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{compatible.maalems.map((maalem) => <CompatibleMaalemCard key={maalem.id} maalem={maalem} locale={locale} serviceId={id} labels={{ verified: t('verified'), city: t('city'), areas: t('areas'), missions: t('missions', { count: maalem.closed_interventions_for_service }), notice: t('availabilityNotice'), profile: t('profile'), choose: t('choose') }} />)}</div>}
        {pagination && pagination.total_pages > 1 && <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t('pagination')}><Button asChild variant="outline" className={!pagination.has_previous ? 'pointer-events-none opacity-50' : ''}><Link href={href(Math.max(1, page - 1))} aria-disabled={!pagination.has_previous}><ArrowLeft className="size-4 rtl:rotate-180" />{t('previous')}</Link></Button><span className="text-sm font-semibold">{t('page', { page: pagination.current_page })}</span><Button asChild variant="outline" className={!pagination.has_next ? 'pointer-events-none opacity-50' : ''}><Link href={href(page + 1)} aria-disabled={!pagination.has_next}>{t('next')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button></nav>}
      </section>

      <aside className="mt-12 grid gap-4 bg-primary p-6 text-primary-foreground sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="text-xl font-bold">{t('quickRequest')}</h2><p className="mt-1 text-sm opacity-75">{t('emptyText')}</p></div><Button asChild variant="secondary" className="min-h-11 bg-white"><Link href={quickServiceRequestHref(locale)}>{t('quickRequest')}</Link></Button></aside>
    </div>
    <div className="sticky bottom-0 z-30 border-t border-amber-300 bg-[#fffdf7]/95 p-3 backdrop-blur lg:hidden"><Button asChild className="min-h-12 w-full"><Link href={serviceRequestHref(locale, id)}>{t('requestService')}</Link></Button></div>
  </div>
}

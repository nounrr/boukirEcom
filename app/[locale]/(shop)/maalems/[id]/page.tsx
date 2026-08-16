import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Hammer, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { MaalemPublicSummary } from '@/components/service-requests/maalem-public-summary'
import { ServiceCard } from '@/components/services/service-card'
import { Button } from '@/components/ui/button'
import { normalizeLocale } from '@/i18n/locale'
import { localizedCategoryName, quickServiceRequestHref } from '@/lib/service-catalog'
import { getPublicMaalem, resolvePublicMaalemPhoto } from '@/lib/service-requests'
import { buildPageMetadata, getSiteUrl, localizedPath } from '@/lib/seo/metadata'

type Props = { params: Promise<{ locale: string; id: string }> }
const positiveId = (value: string) => { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, id: rawId } = await params
  const locale = normalizeLocale(rawLocale)
  const id = positiveId(rawId)
  if (!id) return {}
  const [maalem, t] = await Promise.all([getPublicMaalem(id), getTranslations({ locale, namespace: 'maalemDetailPage' })])
  if (!maalem) return {}
  const category = locale === 'ar' ? maalem.category.name_ar || maalem.category.name : maalem.category.name || maalem.category.name_ar
  const description = (maalem.professional_summary || t('metadataFallback')).slice(0, 180)
  return buildPageMetadata({ locale, title: `${maalem.public_name} — ${category || t('verified')}`, description, path: `/maalems/${id}`, imageUrl: resolvePublicMaalemPhoto(maalem.photo_url), openGraphType: 'profile' })
}

export default async function PublicMaalemPage({ params }: Props) {
  const { locale: rawLocale, id: rawId } = await params
  const locale = normalizeLocale(rawLocale)
  const id = positiveId(rawId)
  if (!id) notFound()
  const [maalem, t] = await Promise.all([getPublicMaalem(id), getTranslations({ locale, namespace: 'maalemDetailPage' })])
  if (!maalem) notFound()

  const category = locale === 'ar' ? maalem.category.name_ar || maalem.category.name : maalem.category.name || maalem.category.name_ar
  const photo = resolvePublicMaalemPhoto(maalem.photo_url)
  const requestHref = `/${locale}/service-requests/maalem/${maalem.id}`
  const profilePath = localizedPath(locale, `/maalems/${maalem.id}`)
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'ProfilePage', url: new URL(profilePath, getSiteUrl()).toString(),
    mainEntity: { '@type': 'Person', name: maalem.public_name, image: photo || undefined, jobTitle: category || undefined, knowsAbout: maalem.skills, url: new URL(profilePath, getSiteUrl()).toString() },
  }
  const summaryLabels = { verified: t('verified'), location: t('location'), areas: t('areas'), experience: (years: number) => t('experience', { years }), noPhoto: t('noPhoto') }
  const lastClosed = maalem.statistics.last_closed_intervention_at ? new Date(maalem.statistics.last_closed_intervention_at) : null

  return <main className="relative overflow-hidden bg-[#fbf8ef] dark:bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_12%_12%,rgba(245,184,46,.2),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(6,78,59,.11),transparent_30%)]" aria-hidden="true" />
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href={`/${locale}/maalems`} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="size-4 rtl:rotate-180" />{t('back')}</Link>
      <nav aria-label={t('breadcrumb')} className="mt-2 text-xs text-muted-foreground"><Link href={`/${locale}/maalems`} className="hover:text-foreground">{t('breadcrumb')}</Link><span className="mx-2">/</span><span aria-current="page">{maalem.public_name}</span></nav>

      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <div className="min-w-0">
          <header><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-emerald-800 dark:text-emerald-300"><Sparkles className="size-4" />{t('eyebrow')}</p><h1 className="mt-4 text-4xl font-black tracking-[-.04em] text-[#29261f] dark:text-foreground sm:text-5xl lg:text-6xl">{maalem.public_name}</h1></header>
          <MaalemPublicSummary maalem={maalem} locale={locale} labels={summaryLabels} className="mt-7" />

          <section className="mt-8 grid overflow-hidden border border-emerald-900/15 bg-emerald-950 text-white sm:grid-cols-[auto_1fr]" aria-labelledby="proof-heading">
            <div className="flex items-center justify-center bg-amber-400 px-7 py-6 text-amber-950"><span className="text-5xl font-black tabular-nums">{maalem.statistics.closed_interventions}</span></div>
            <div className="p-6"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-amber-300"><CheckCircle2 className="size-4" />{t('proof')}</p><h2 id="proof-heading" className="mt-2 text-xl font-bold">{t('closed', { count: maalem.statistics.closed_interventions })}</h2><p className="mt-2 text-sm leading-6 text-white/70">{t('proofText')}</p>{lastClosed && !Number.isNaN(lastClosed.valueOf()) && <p className="mt-3 text-xs text-white/60">{t('lastClosed', { date: t('monthYear', { date: lastClosed }) })}</p>}</div>
          </section>

          <section className="mt-12 grid gap-8 md:grid-cols-2" aria-label={t('about')}>
            <article className="border-s-2 border-amber-400 ps-5"><h2 className="text-2xl font-black tracking-tight">{t('about')}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{maalem.professional_summary || t('aboutFallback')}</p></article>
            <article className="border-s-2 border-emerald-600 ps-5"><h2 className="flex items-center gap-2 text-2xl font-black tracking-tight"><BriefcaseBusiness className="size-5 text-emerald-700" />{t('expertise')}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{t('expertiseText')}</p>{maalem.skills.length ? <ul className="mt-4 flex flex-wrap gap-2">{maalem.skills.map((skill) => <li key={skill} className="border border-amber-200 bg-[#fffdf7] px-3 py-2 text-sm font-medium">{skill}</li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">{t('skillsFallback')}</p>}</article>
          </section>

          <section className="mt-14" aria-labelledby="services-heading"><div className="border-b border-foreground/10 pb-5"><h2 id="services-heading" className="text-3xl font-black tracking-tight">{t('services')}</h2><p className="mt-2 text-sm text-muted-foreground">{t('servicesText')}</p></div>{maalem.compatible_services.length ? <div className="mt-6 grid gap-5 md:grid-cols-2">{maalem.compatible_services.map((service) => <ServiceCard key={service.id} service={service} locale={locale} viewLabel={t('serviceView')} requestLabel={t('serviceRequest')} moreCategoriesLabel={t('moreCategories')} />)}</div> : <p className="mt-6 border border-dashed border-amber-300 bg-card p-8 text-center text-sm text-muted-foreground">{t('servicesEmpty')}</p>}</section>

          <section className="mt-14" aria-labelledby="stats-heading"><h2 id="stats-heading" className="text-3xl font-black tracking-tight">{t('statistics')}</h2><h3 className="mt-5 text-sm font-bold uppercase tracking-[.14em] text-emerald-800">{t('byService')}</h3>{maalem.statistics.by_service.length ? <ul className="mt-3 divide-y divide-amber-200 border-y border-amber-200">{maalem.statistics.by_service.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-4"><span className="font-medium">{item.name}</span><span className="text-sm font-bold tabular-nums text-emerald-800">{t('closed', { count: item.closed_interventions })}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{t('noBreakdown')}</p>}</section>

          <div className="mt-14 grid gap-5 sm:grid-cols-2"><section className="border border-amber-200 bg-card p-6"><Hammer className="size-7 text-amber-700" /><h2 className="mt-4 text-xl font-bold">{t('realizations')}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t('realizationsEmpty')}</p></section><section className="border border-amber-200 bg-card p-6"><ShieldCheck className="size-7 text-emerald-700" /><h2 className="mt-4 text-xl font-bold">{t('reviews')}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t('reviewsEmpty')}</p></section></div>
        </div>

        <aside className="border border-amber-300 bg-[#2d2a24] p-6 text-white shadow-[0_28px_70px_-40px_rgba(35,28,14,.9)] lg:sticky lg:top-24"><Wrench className="size-9 text-amber-300" /><h2 className="mt-5 text-xl font-bold">{t('ctaTitle')}</h2><p className="mt-3 text-sm leading-6 text-white/70">{t('ctaText')}</p><Button asChild size="lg" className="mt-6 min-h-12 w-full bg-amber-400 text-amber-950 hover:bg-amber-300"><Link href={requestHref}>{t('cta')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button><Button asChild size="lg" variant="outline" className="mt-3 min-h-12 w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href={quickServiceRequestHref(locale)}>{t('quick')}</Link></Button><p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/60">{t('privacy')}</p></aside>
      </div>
    </div>
    <div className="sticky bottom-0 z-30 border-t border-amber-300 bg-[#fffdf7]/95 p-3 backdrop-blur lg:hidden"><Button asChild className="min-h-12 w-full"><Link href={requestHref}>{t('cta')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button></div>
  </main>
}

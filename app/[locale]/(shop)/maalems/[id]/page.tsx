import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Award, BadgeCheck, BriefcaseBusiness, CheckCircle2, Hammer, Layers, Lock, MapPin, ShieldCheck, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { ServiceCard } from '@/components/services/service-card'
import { PublicMaalemPortrait } from '@/components/services/public-maalem-portrait'
import { PublicRating } from '@/components/maalems/public-rating'
import { Button } from '@/components/ui/button'
import { normalizeLocale } from '@/i18n/locale'
import { quickServiceRequestHref } from '@/lib/service-catalog'
import { getPublicMaalem, getPublicMaalemReviews, resolvePublicMaalemPhoto } from '@/lib/service-requests'
import { buildPageMetadata, localizedUrl, seoImageUrl } from '@/lib/seo/metadata'
import { buildMaalemProfileJsonLd } from '@/lib/seo/maalem-profile-json-ld'

type Props = { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ reviews_page?: string | string[] }> }
const positiveId = (value: string) => { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null }

/** Le lecteur ne doit pas avoir a scroller 40 avis : 5 puis un bouton "suivants". */
const REVIEWS_PER_PAGE = 5

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
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

/** Largeur : pleine sur portable et laptop, 90 % sur tres grand ecran. */
const SHELL = 'mx-auto w-full max-w-[88rem] px-4 sm:px-6 lg:px-10'

export default async function PublicMaalemPage({ params, searchParams }: Props) {
  const [{ locale: rawLocale, id: rawId }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const id = positiveId(rawId)
  if (!id) notFound()
  const rawReviewsPage = Array.isArray(query.reviews_page) ? query.reviews_page[0] : query.reviews_page
  const reviewsPage = rawReviewsPage ? positiveId(rawReviewsPage) || 1 : 1
  const returnTo = `/${locale}/maalems/${id}${reviewsPage > 1 ? `?reviews_page=${reviewsPage}` : ''}`
  const [maalem, reviewsData, t] = await Promise.all([
    getPublicMaalem(id), getPublicMaalemReviews(id, reviewsPage, REVIEWS_PER_PAGE),
    getTranslations({ locale, namespace: 'maalemDetailPage' }),
  ])
  if (!maalem) notFound()

  const category = locale === 'ar' ? maalem.category.name_ar || maalem.category.name : maalem.category.name || maalem.category.name_ar
  const photo = resolvePublicMaalemPhoto(maalem.photo_url)
  const requestHref = `/${locale}/service-requests/maalem/${maalem.id}`
  const closed = maalem.statistics.closed_interventions
  const lastClosed = maalem.statistics.last_closed_intervention_at ? new Date(maalem.statistics.last_closed_intervention_at) : null
  const hasLastClosed = Boolean(lastClosed && !Number.isNaN(lastClosed.valueOf()))

  // Share of each service in the verified total, so the breakdown reads as proportion
  // rather than a bare list of numbers. Guarded against a zero total.
  const topService = maalem.statistics.by_service.reduce((max, item) => Math.max(max, item.closed_interventions), 0)

  const absoluteProfileUrl = localizedUrl(locale, `/maalems/${maalem.id}`)
  const jsonLd = buildMaalemProfileJsonLd({
    profileUrl: absoluteProfileUrl,
    publicName: maalem.public_name,
    photoUrl: seoImageUrl(photo),
    category,
    skills: maalem.skills,
    interventionAreas: maalem.intervention_areas,
    averageRating: maalem.statistics.average_rating,
    reviewCount: maalem.statistics.review_count,
    ratedServiceName: t('ratedServiceName', { name: maalem.public_name }),
  })

  const quickStats = [
    { icon: CheckCircle2, value: closed, label: t('statInterventions'), surface: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50', iconTone: 'text-emerald-700 dark:text-emerald-300' },
    maalem.experience_years != null ? { icon: Award, value: maalem.experience_years, label: t('statExperience'), surface: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40', iconTone: 'text-amber-700 dark:text-amber-300' } : null,
    maalem.statistics.review_count > 0 && maalem.statistics.average_rating != null
      ? { icon: Star, value: maalem.statistics.average_rating, label: t('statRating'), surface: 'border-amber-200 bg-[#fff9e8] dark:border-amber-800 dark:bg-amber-950/40', iconTone: 'text-amber-700 dark:text-amber-300' }
      : null,
    maalem.intervention_areas.length ? { icon: MapPin, value: maalem.intervention_areas.length, label: t('statAreas'), surface: 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40', iconTone: 'text-sky-700 dark:text-sky-300' } : null,
    maalem.skills.length ? { icon: Layers, value: maalem.skills.length, label: t('statSkills'), surface: 'border-emerald-200 bg-[#eff9f3] dark:border-emerald-800 dark:bg-emerald-950/50', iconTone: 'text-emerald-700 dark:text-emerald-300' } : null,
  ].filter(Boolean) as Array<{ icon: typeof CheckCircle2; value: number; label: string; surface: string; iconTone: string }>

  const trustPoints = [
    { icon: ShieldCheck, text: t('trustVerified') },
    { icon: CheckCircle2, text: t('trustProof') },
    { icon: Lock, text: t('trustPrivacy') },
  ]

  // Ancres de la barre de navigation : la page reste rendue cote serveur,
  // donc des liens de saut plutot que des onglets pilotes en JavaScript.
  const sectionLinks = [
    ...(maalem.professional_summary || maalem.skills.length ? [{ href: '#about', label: t('about') }] : []),
    ...(maalem.intervention_areas.length ? [{ href: '#coverage', label: t('areas') }] : []),
    { href: '#reviews', label: t('reviews') },
    ...(maalem.compatible_services.length ? [{ href: '#services', label: t('services') }] : []),
  ]

  return <main className="bg-[#fcfdfa] dark:bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

    <div className={`${SHELL} pb-28 pt-5 sm:pt-7 lg:pb-16`}>
      <Link href={`/${locale}/maalems`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30">
        <ArrowLeft className="size-4 rtl:rotate-180" />{t('back')}
      </Link>

      <div className="mt-8 grid items-start gap-9 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-card">
            <div className="flex min-w-0 items-start gap-4 lg:flex-col">
              <div className="order-1 min-w-0 flex-1 lg:order-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">{category || t('verified')}</p>
                <h1 className="mt-2 break-words text-[clamp(1.7rem,4vw,2.4rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-stone-950 dark:text-white">{maalem.public_name}</h1>
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300"><BadgeCheck className="size-4 fill-emerald-700 text-white dark:fill-emerald-500 dark:text-card" aria-hidden="true" />{t('verified')}</p>
              </div>
              <div className="relative order-2 size-24 shrink-0 overflow-hidden rounded-xl bg-emerald-950 lg:order-1 lg:size-40">
                <PublicMaalemPortrait src={photo} name={maalem.public_name} sizes="(min-width: 1024px) 160px, 96px" priority fallbackLabel={t('noPhoto')} />
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-stone-200 pt-5 text-sm dark:border-white/10">
              {maalem.city && <p className="flex items-center gap-2 text-stone-700 dark:text-stone-300"><MapPin className="size-4 shrink-0 text-emerald-800 dark:text-emerald-300" aria-hidden="true" />{maalem.city}</p>}
              <PublicRating rating={maalem.statistics.average_rating} count={maalem.statistics.review_count} locale={locale} compact labels={{ rating: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verified: t('verifiedReviews'), empty: t('reviewsEmpty') }} />
            </div>
          </div>
          <div className="mt-3 rounded-[1.5rem] bg-emerald-950 p-5 text-white dark:bg-emerald-900">
            <h2 className="text-base font-semibold text-white">{t('ctaTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-100">{t('ctaText')}</p>
            <Button asChild size="lg" className="mt-5 hidden h-auto min-h-12 w-full whitespace-normal rounded-xl bg-white px-4 py-3 text-center font-semibold text-emerald-950 hover:bg-stone-100 lg:inline-flex">
              <Link href={requestHref}>{t('cta')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link>
            </Button>
            <Link href={quickServiceRequestHref(locale, returnTo)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/30 px-4 py-2 text-center text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 motion-reduce:transition-none">{t('quick')}</Link>
            <p className="mt-4 flex items-start gap-2 border-t border-white/20 pt-4 text-xs leading-5 text-emerald-100"><Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{t('privacy')}</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          {(maalem.professional_summary || maalem.skills.length > 0) && (
            <section id="about" className="scroll-mt-24 grid gap-8 border-b border-stone-200 pb-8 md:grid-cols-2 dark:border-white/10" aria-label={t('about')}>
              {maalem.professional_summary && <article>
                <h2 className="text-2xl font-semibold tracking-tight">{t('about')}</h2>
                <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{maalem.professional_summary}</p>
              </article>}
              {maalem.skills.length > 0 && <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-800 dark:bg-amber-950/30">
                <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><BriefcaseBusiness className="size-5 text-amber-700 dark:text-amber-300" aria-hidden="true" />{t('expertise')}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{t('expertiseText')}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {maalem.skills.map((skill) => (
                    <li key={skill} className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">{skill}</li>
                  ))}
                </ul>
              </article>}
            </section>
          )}

          <nav className="border-b border-stone-200 dark:border-white/10" aria-label={t('about')}>
            <ul className="flex flex-wrap gap-x-6">
              {sectionLinks.map((link) => <li key={link.href}><a href={link.href} className="inline-flex min-h-11 items-center border-b-2 border-transparent text-sm font-medium text-stone-600 transition-colors duration-150 hover:border-emerald-800 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none dark:text-stone-300 dark:hover:text-white">{link.label}</a></li>)}
            </ul>
          </nav>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-5 border-y border-stone-300 py-6 sm:grid-cols-3 xl:grid-cols-5 dark:border-white/15" aria-label={t('quickStats')}>
            {quickStats.map((stat) => <div key={stat.label} className="min-w-0"><dt className="text-xs leading-5 text-stone-600 dark:text-stone-300">{stat.label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-emerald-950 dark:text-white">{stat.value}</dd></div>)}
          </dl>

          {/* ── Proof of work ── */}
          <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-6 shadow-[0_18px_40px_-36px_rgba(4,90,64,.7)] sm:p-8 dark:border-emerald-800 dark:bg-emerald-950/40" aria-labelledby="proof-heading">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white dark:bg-emerald-600" aria-hidden="true"><ShieldCheck className="size-6" /></span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">{t('proof')}</p>
                <h2 id="proof-heading" className="mt-1 text-2xl font-semibold tracking-tight text-emerald-950 dark:text-white">{t('closed', { count: closed })}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-200">{t('proofText')}</p>
                {hasLastClosed && <p className="mt-3 text-xs text-emerald-900 dark:text-emerald-200">{t('lastClosed', { date: t('monthYear', { date: lastClosed! }) })}</p>}
              </div>
            </div>
            <Link href={quickServiceRequestHref(locale, returnTo)} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-emerald-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 lg:hidden dark:text-emerald-300">{t('quick')}</Link>

            {/* Breakdown as proportional bars: shows where the experience actually is. */}
            {maalem.statistics.by_service.length > 0 && (
              <div className="mt-7 border-t border-emerald-200 pt-6 dark:border-emerald-800">
                <h3 className="text-xs font-semibold text-muted-foreground">{t('byService')}</h3>
                <ul className="mt-4 space-y-3.5">
                  {maalem.statistics.by_service.map((item) => {
                    const share = closed > 0 ? Math.round((item.closed_interventions / closed) * 100) : 0
                    const width = topService > 0 ? Math.max(6, Math.round((item.closed_interventions / topService) * 100)) : 0
                    return (
                      <li key={item.id}>
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="truncate text-sm font-medium">{item.name}</span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{item.closed_interventions}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900">
                          <div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400" style={{ width: `${width}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{t('statShare', { percent: share })}</p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>

          {maalem.intervention_areas.length > 0 && (
            <section id="coverage" className="scroll-mt-24 rounded-[1.5rem] border border-sky-200 bg-sky-50/70 p-6 dark:border-sky-800 dark:bg-sky-950/30" aria-labelledby="coverage-heading">
              <h2 id="coverage-heading" className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><MapPin className="size-5 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />{t('areas')}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{t('coverageText')}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {maalem.intervention_areas.map((area) => (
                  <li key={area} className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-medium text-sky-950 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100">
                    <MapPin className="size-3.5 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Avis : 5 par page, puis bouton "suivants" ── */}
          <section id="reviews" className="scroll-mt-24 rounded-[1.75rem] border border-amber-200 bg-amber-50/30 p-6 sm:p-8 dark:border-amber-900 dark:bg-amber-950/20" aria-labelledby="reviews-heading">
            <div className="flex flex-col gap-5 border-b border-black/[0.06] pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" aria-hidden="true"><Star className="size-5" /></span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{t('verifiedReviews')}</p>
                  <h2 id="reviews-heading" className="mt-1 text-2xl font-semibold">{t('reviews')}</h2>
                  <div className="mt-3"><PublicRating rating={maalem.statistics.average_rating} count={maalem.statistics.review_count} locale={locale} labels={{ rating: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verified: t('verifiedReviews'), empty: t('reviewsEmpty') }} /></div>
                </div>
              </div>
              {maalem.statistics.review_count > 0 && <div className="w-full max-w-xs space-y-1.5" aria-label={t('ratingDistribution')}>{[5,4,3,2,1].map((rating) => { const count = maalem.statistics.rating_distribution[rating as 1|2|3|4|5] || 0; const percent = maalem.statistics.review_count ? Math.round((count / maalem.statistics.review_count) * 100) : 0; return <div key={rating} className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2 text-xs"><span>{rating}★</span><span className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800" role="progressbar" aria-label={t('distributionLine', { rating, count })} aria-valuenow={count} aria-valuemin={0} aria-valuemax={maalem.statistics.review_count}><span className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300" style={{ width: `${percent}%` }} /></span><span className="text-end tabular-nums text-muted-foreground">{count}</span></div>})}</div>}
            </div>

            {!reviewsData || reviewsData.reviews.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">{t('reviewsEmpty')}</p> : <div className="divide-y divide-black/[0.06] dark:divide-white/10">{reviewsData.reviews.map((review, index) => <article key={`${review.submitted_at}-${index}`} className="py-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{review.author_name || t('anonymousClient')}</p><p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"><CheckCircle2 className="size-3.5" aria-hidden="true" />{t('verifiedIntervention')}</p></div><time dateTime={review.submitted_at} className="text-xs text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(review.submitted_at))}</time></div><div className="mt-3"><PublicRating rating={review.rating} count={1} locale={locale} compact labels={{ rating: t('singleRatingLabel', { rating: '{rating}' }), verified: t('reviewSingular'), empty: t('reviewsEmpty') }} /></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{review.comment || t('reviewWithoutComment')}</p></article>)}</div>}

            {reviewsData && reviewsData.pagination.total_pages > 1 && (
              <nav className="flex flex-col items-center gap-3 border-t border-black/[0.06] pt-6 dark:border-white/10" aria-label={t('reviewsPagination')}>
                {reviewsData.pagination.has_next && (
                  <Button asChild variant="outline" className="h-11 rounded-full border-black/10 px-7 font-medium dark:border-white/15">
                    <Link href={`/${locale}/maalems/${id}?reviews_page=${reviewsData.pagination.current_page + 1}#reviews`}>
                      {t('nextReviews')}<ArrowRight className="size-4 rtl:rotate-180" />
                    </Link>
                  </Button>
                )}
                <div className="flex items-center gap-4">
                  {reviewsData.pagination.has_previous && (
                    <Link href={`/${locale}/maalems/${id}?reviews_page=${Math.max(1, reviewsData.pagination.current_page - 1)}#reviews`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground">
                      <ArrowLeft className="size-4 rtl:rotate-180" />{t('previousReviews')}
                    </Link>
                  )}
                  <span className="text-xs text-muted-foreground">{t('reviewsPage', { page: reviewsData.pagination.current_page, pages: reviewsData.pagination.total_pages })}</span>
                </div>
              </nav>
            )}
          </section>

          {/* ── Services proposes : derniere section ── */}
          {maalem.compatible_services.length > 0 && <section id="services" className="scroll-mt-24" aria-labelledby="services-heading">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" aria-hidden="true"><Layers className="size-5" /></span>
              <h2 id="services-heading" className="text-xl font-semibold tracking-tight">{t('services')}</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t('servicesText')}</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {maalem.compatible_services.map((service) => (
                  <ServiceCard key={service.id} service={service} locale={locale} viewLabel={t('serviceView')} requestLabel={t('serviceRequest')} moreCategoriesLabel={t('moreCategories')} />
                ))}
              </div>
          </section>}
        </div>
      </div>
    </div>

    {/* Mobile conversion bar */}
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.08] bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden dark:border-white/10 dark:bg-background">
      <Button asChild className="h-auto min-h-12 w-full whitespace-normal rounded-full bg-emerald-900 px-4 py-3 text-center font-medium text-white hover:bg-emerald-800 dark:bg-emerald-700">
        <Link href={requestHref}>{t('cta')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
      </Button>
    </div>
  </main>
}

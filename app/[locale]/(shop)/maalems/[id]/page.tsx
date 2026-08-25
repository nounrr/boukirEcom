import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Award, BriefcaseBusiness, CheckCircle2, Hammer,
  Layers, Lock, MapPin, ShieldCheck, Sparkles, Star, Wrench,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { ServiceCard } from '@/components/services/service-card'
import { PublicRating } from '@/components/maalems/public-rating'
import { getMaalemInitials } from '@/components/service-requests/maalem-public-summary'
import { Button } from '@/components/ui/button'
import { normalizeLocale } from '@/i18n/locale'
import { quickServiceRequestHref } from '@/lib/service-catalog'
import { getPublicMaalem, getPublicMaalemReviews, resolvePublicMaalemPhoto } from '@/lib/service-requests'
import { buildPageMetadata, getSiteUrl, localizedPath } from '@/lib/seo/metadata'
import { buildMaalemProfileJsonLd } from '@/lib/seo/maalem-profile-json-ld'

type Props = { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ reviews_page?: string | string[] }> }
const positiveId = (value: string) => { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null }

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

export default async function PublicMaalemPage({ params, searchParams }: Props) {
  const [{ locale: rawLocale, id: rawId }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const id = positiveId(rawId)
  if (!id) notFound()
  const rawReviewsPage = Array.isArray(query.reviews_page) ? query.reviews_page[0] : query.reviews_page
  const reviewsPage = rawReviewsPage ? positiveId(rawReviewsPage) || 1 : 1
  const [maalem, reviewsData, t] = await Promise.all([
    getPublicMaalem(id), getPublicMaalemReviews(id, reviewsPage, 6),
    getTranslations({ locale, namespace: 'maalemDetailPage' }),
  ])
  if (!maalem) notFound()

  const category = locale === 'ar' ? maalem.category.name_ar || maalem.category.name : maalem.category.name || maalem.category.name_ar
  const photo = resolvePublicMaalemPhoto(maalem.photo_url)
  const requestHref = `/${locale}/service-requests/maalem/${maalem.id}`
  const profilePath = localizedPath(locale, `/maalems/${maalem.id}`)
  const closed = maalem.statistics.closed_interventions
  const lastClosed = maalem.statistics.last_closed_intervention_at ? new Date(maalem.statistics.last_closed_intervention_at) : null
  const hasLastClosed = Boolean(lastClosed && !Number.isNaN(lastClosed.valueOf()))

  // Share of each service in the verified total, so the breakdown reads as proportion
  // rather than a bare list of numbers. Guarded against a zero total.
  const topService = maalem.statistics.by_service.reduce((max, item) => Math.max(max, item.closed_interventions), 0)

  const absoluteProfileUrl = new URL(profilePath, getSiteUrl()).toString()
  const jsonLd = buildMaalemProfileJsonLd({
    profileUrl: absoluteProfileUrl,
    publicName: maalem.public_name,
    photoUrl: photo,
    category,
    skills: maalem.skills,
    interventionAreas: maalem.intervention_areas,
    averageRating: maalem.statistics.average_rating,
    reviewCount: maalem.statistics.review_count,
    ratedServiceName: t('ratedServiceName', { name: maalem.public_name }),
  })

  const quickStats = [
    maalem.experience_years != null ? { icon: Award, value: maalem.experience_years, label: t('statExperience') } : null,
    { icon: CheckCircle2, value: closed, label: t('statInterventions') },
    maalem.statistics.review_count > 0 && maalem.statistics.average_rating != null
      ? { icon: Star, value: maalem.statistics.average_rating, label: t('statRating') }
      : null,
    maalem.intervention_areas.length ? { icon: MapPin, value: maalem.intervention_areas.length, label: t('statAreas') } : null,
    maalem.skills.length ? { icon: Layers, value: maalem.skills.length, label: t('statSkills') } : null,
  ].filter(Boolean) as Array<{ icon: typeof Award; value: number; label: string }>

  const trustPoints = [
    { icon: ShieldCheck, text: t('trustVerified') },
    { icon: CheckCircle2, text: t('trustProof') },
    { icon: Lock, text: t('trustPrivacy') },
  ]

  return <main className="bg-[#fbf8ef] dark:bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

    <header className="border-b border-stone-200 bg-[#fffdf8] dark:border-border dark:bg-card">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
        <Link href={`/${locale}/maalems`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40">
          <ArrowLeft className="size-4 rtl:rotate-180" />{t('back')}
        </Link>

        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
          {/* Portrait */}
          <div className="relative size-32 shrink-0 overflow-hidden rounded-[14px] border border-stone-200 bg-amber-100 shadow-[0_16px_40px_-30px_rgba(41,37,32,.5)] sm:size-40 dark:border-border">
            {photo ? (
              <Image src={photo} alt={maalem.public_name} fill sizes="(min-width: 1024px) 176px, (min-width: 640px) 160px, 128px" className="object-cover" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-amber-100 text-5xl font-black text-amber-950" role="img" aria-label={t('noPhoto')}>
                {getMaalemInitials(maalem.public_name)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-emerald-800 dark:text-emerald-300">
              <Sparkles className="size-4" aria-hidden="true" />{t('eyebrow')}
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-.035em] text-foreground sm:text-5xl">{maalem.public_name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                <CheckCircle2 className="size-4" aria-hidden="true" />{t('verified')}
              </span>
              {category && (
                <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                  <BriefcaseBusiness className="size-4" aria-hidden="true" />{category}
                </span>
              )}
              {maalem.city && (
                <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                  <MapPin className="size-4" aria-hidden="true" />{maalem.city}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <Star className="size-4" aria-hidden="true" />{t('heroAvailability')}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats strip — the numeric spine of the page. */}
        {quickStats.length > 0 && (
          <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-[12px] border border-stone-200 bg-stone-200 sm:grid-cols-4 dark:border-border dark:bg-border" aria-label={t('quickStats')}>
            {quickStats.map((stat) => (
              <div key={stat.label} className="m-px bg-card px-4 py-5 text-center sm:px-5">
                <stat.icon className="mx-auto size-5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <dd className="mt-2 text-2xl font-black tabular-nums text-foreground">{stat.value}</dd>
                <dt className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12">
        <div className="min-w-0 space-y-14">

          {/* ── Proof of work ── */}
          <section aria-labelledby="proof-heading">
            <div className="overflow-hidden rounded-[14px] border border-emerald-900/20 bg-emerald-950 text-white">
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-[10px] bg-amber-400 text-amber-950">
                  <span className="text-4xl font-black tabular-nums">{closed}</span>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-amber-300">
                    <CheckCircle2 className="size-4" aria-hidden="true" />{t('proof')}
                  </p>
                  <h2 id="proof-heading" className="mt-2 text-2xl font-bold tracking-tight">{t('closed', { count: closed })}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/70">{t('proofText')}</p>
                  {hasLastClosed && <p className="mt-3 text-xs text-white/55">{t('lastClosed', { date: t('monthYear', { date: lastClosed! }) })}</p>}
                </div>
              </div>

              {/* Breakdown as proportional bars: shows where the experience actually is. */}
              {maalem.statistics.by_service.length > 0 && (
                <div className="border-t border-white/10 p-6 sm:p-8">
                  <h3 className="text-xs font-bold uppercase tracking-[.14em] text-amber-300">{t('byService')}</h3>
                  <ul className="mt-4 space-y-3.5">
                    {maalem.statistics.by_service.map((item) => {
                      const share = closed > 0 ? Math.round((item.closed_interventions / closed) * 100) : 0
                      const width = topService > 0 ? Math.max(6, Math.round((item.closed_interventions / topService) * 100)) : 0
                      return (
                        <li key={item.id}>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="truncate text-sm font-medium">{item.name}</span>
                            <span className="shrink-0 text-sm font-bold tabular-nums text-amber-300">{item.closed_interventions}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${width}%` }} />
                          </div>
                          <p className="mt-1 text-[11px] text-white/45">{t('statShare', { percent: share })}</p>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* ── About + expertise ── */}
          <section className="grid gap-10 md:grid-cols-2" aria-label={t('about')}>
            <article>
              <h2 className="text-2xl font-black tracking-tight">{t('about')}</h2>
              <div className="mt-3 h-1 w-12 rounded-full bg-amber-400" aria-hidden="true" />
              <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
                {maalem.professional_summary || t('aboutFallback')}
              </p>
            </article>
            <article>
              <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight">
                <BriefcaseBusiness className="size-5 text-emerald-700" aria-hidden="true" />{t('expertise')}
              </h2>
              <div className="mt-3 h-1 w-12 rounded-full bg-emerald-600" aria-hidden="true" />
              <p className="mt-5 text-sm leading-6 text-muted-foreground">{t('expertiseText')}</p>
              {maalem.skills.length ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {maalem.skills.map((skill) => (
                    <li key={skill} className="rounded-[6px] border border-amber-200 bg-[#fffdf7] px-3.5 py-1.5 text-sm font-medium text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-4 text-sm text-muted-foreground">{t('skillsFallback')}</p>}
            </article>
          </section>

          {/* ── Coverage: declared areas, previously buried in a sub-line ── */}
          <section aria-labelledby="coverage-heading">
            <h2 id="coverage-heading" className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <MapPin className="size-5 text-amber-700" aria-hidden="true" />{t('areas')}
            </h2>
            <div className="mt-3 h-1 w-12 rounded-full bg-amber-400" aria-hidden="true" />
            <p className="mt-4 text-sm text-muted-foreground">{t('coverageText')}</p>
            {maalem.intervention_areas.length ? (
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {maalem.intervention_areas.map((area) => (
                  <li key={area} className="flex items-center gap-2.5 rounded-[8px] border border-stone-200 bg-card px-4 py-3 text-sm font-medium dark:border-border">
                    <MapPin className="size-4 shrink-0 text-amber-700" aria-hidden="true" />
                    <span className="truncate">{area}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-5 rounded-[12px] border border-dashed border-amber-300 bg-card p-6 text-center text-sm text-muted-foreground">{t('coverageEmpty')}</p>}
          </section>

          {/* ── Compatible services ── */}
          <section aria-labelledby="services-heading">
            <h2 id="services-heading" className="text-2xl font-black tracking-tight">{t('services')}</h2>
            <div className="mt-3 h-1 w-12 rounded-full bg-emerald-600" aria-hidden="true" />
            <p className="mt-4 text-sm text-muted-foreground">{t('servicesText')}</p>
            {maalem.compatible_services.length ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {maalem.compatible_services.map((service) => (
                  <ServiceCard key={service.id} service={service} locale={locale} viewLabel={t('serviceView')} requestLabel={t('serviceRequest')} moreCategoriesLabel={t('moreCategories')} />
                ))}
              </div>
            ) : <p className="mt-6 rounded-[12px] border border-dashed border-amber-300 bg-card p-8 text-center text-sm text-muted-foreground">{t('servicesEmpty')}</p>}
          </section>

          <section className="rounded-[14px] border border-stone-200 bg-card p-6 dark:border-border">
            <Hammer className="size-7 text-amber-700" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold">{t('realizations')}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('realizationsEmpty')}</p>
          </section>

          <section id="reviews" className="scroll-mt-24 rounded-[14px] border border-stone-200 bg-card p-5 sm:p-7 dark:border-border" aria-labelledby="reviews-heading">
            <div className="flex flex-col gap-5 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-emerald-700"><ShieldCheck className="size-4" aria-hidden="true" />{t('verifiedReviews')}</p><h2 id="reviews-heading" className="mt-2 text-2xl font-black">{t('reviews')}</h2><div className="mt-3"><PublicRating rating={maalem.statistics.average_rating} count={maalem.statistics.review_count} locale={locale} labels={{ rating: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verified: t('verifiedReviews'), empty: t('reviewsEmpty') }} /></div></div>
              {maalem.statistics.review_count > 0 && <div className="w-full max-w-xs space-y-1.5" aria-label={t('ratingDistribution')}>{[5,4,3,2,1].map((rating) => { const count = maalem.statistics.rating_distribution[rating as 1|2|3|4|5] || 0; const percent = maalem.statistics.review_count ? Math.round((count / maalem.statistics.review_count) * 100) : 0; return <div key={rating} className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2 text-xs"><span>{rating}★</span><span className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t('distributionLine', { rating, count })} aria-valuenow={count} aria-valuemin={0} aria-valuemax={maalem.statistics.review_count}><span className="block h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} /></span><span className="text-end tabular-nums text-muted-foreground">{count}</span></div>})}</div>}
            </div>

            {!reviewsData || reviewsData.reviews.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">{t('reviewsEmpty')}</p> : <div className="divide-y divide-border/60">{reviewsData.reviews.map((review, index) => <article key={`${review.submitted_at}-${index}`} className="py-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-foreground">{review.author_name || t('anonymousClient')}</p><p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="size-3.5" aria-hidden="true" />{t('verifiedIntervention')}</p></div><time dateTime={review.submitted_at} className="text-xs text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(review.submitted_at))}</time></div><div className="mt-3"><PublicRating rating={review.rating} count={1} locale={locale} compact labels={{ rating: t('singleRatingLabel', { rating: '{rating}' }), verified: t('reviewSingular'), empty: t('reviewsEmpty') }} /></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{review.comment || t('reviewWithoutComment')}</p></article>)}</div>}

            {reviewsData && reviewsData.pagination.total_pages > 1 && <nav className="flex items-center justify-center gap-3 border-t border-border/60 pt-5" aria-label={t('reviewsPagination')}><Button asChild variant="outline" size="sm" className={!reviewsData.pagination.has_previous ? 'pointer-events-none opacity-50' : ''}><Link href={`/${locale}/maalems/${id}?reviews_page=${Math.max(1, reviewsData.pagination.current_page - 1)}#reviews`} aria-disabled={!reviewsData.pagination.has_previous}><ArrowLeft className="size-4 rtl:rotate-180" />{t('previousReviews')}</Link></Button><span className="text-xs font-semibold">{t('reviewsPage', { page: reviewsData.pagination.current_page, pages: reviewsData.pagination.total_pages })}</span><Button asChild variant="outline" size="sm" className={!reviewsData.pagination.has_next ? 'pointer-events-none opacity-50' : ''}><Link href={`/${locale}/maalems/${id}?reviews_page=${reviewsData.pagination.current_page + 1}#reviews`} aria-disabled={!reviewsData.pagination.has_next}>{t('nextReviews')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button></nav>}
          </section>
        </div>

        {/* ── Sticky conversion rail ── */}
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-[14px] border border-stone-700 bg-[#2d2a24] p-6 text-white shadow-[0_24px_60px_-42px_rgba(35,28,14,.9)]">
            <Wrench className="size-8 text-amber-300" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold leading-snug">{t('ctaTitle')}</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">{t('ctaText')}</p>
            <Button asChild size="lg" className="mt-6 min-h-12 w-full bg-amber-400 font-bold text-amber-950 hover:bg-amber-300">
              <Link href={requestHref}>{t('cta')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="mt-3 min-h-12 w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href={quickServiceRequestHref(locale)}>{t('quick')}</Link>
            </Button>
            <p className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-white/60">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{t('privacy')}
            </p>
          </div>

          {/* Trust panel: makes the platform's guarantees explicit next to the CTA. */}
          <div className="mt-5 rounded-[14px] border border-emerald-800/20 bg-emerald-50 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <h2 className="text-sm font-bold uppercase tracking-[.14em] text-emerald-900 dark:text-emerald-200">{t('trustTitle')}</h2>
            <ul className="mt-4 space-y-3.5">
              {trustPoints.map((point) => (
                <li key={point.text} className="flex items-start gap-2.5 text-sm leading-6 text-emerald-950/80 dark:text-emerald-100/80">
                  <point.icon className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
                  {point.text}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>

    {/* Mobile conversion bar */}
    <div className="sticky bottom-0 z-30 border-t border-amber-300 bg-[#fffdf7]/95 p-3 backdrop-blur lg:hidden dark:bg-background/95">
      <Button asChild className="min-h-12 w-full font-bold">
        <Link href={requestHref}>{t('cta')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
      </Button>
    </div>
  </main>
}

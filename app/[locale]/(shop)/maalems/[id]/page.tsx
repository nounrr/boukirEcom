import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Award, BadgeCheck, BriefcaseBusiness, CheckCircle2, Hammer,
  Layers, Lock, MapPin, ShieldCheck, Sparkles, Star,
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

/** Surface blanche arrondie : la brique qui structure toute la page. */
const CARD = 'rounded-3xl border border-black/[0.06] bg-white shadow-[0_2px_14px_-10px_rgba(16,24,40,.25)] dark:border-white/10 dark:bg-card'

/** Largeur : pleine sur portable et laptop, 90 % sur tres grand ecran. */
const SHELL = 'mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:w-[90%]'

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
} as const
type Tone = keyof typeof TONES

/** Pastille d'icone coloree, reprise des maquettes. */
function SectionIcon({ icon: Icon, tone }: { icon: typeof Award; tone: Tone }) {
  return (
    <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${TONES[tone]}`} aria-hidden="true">
      <Icon className="size-5" />
    </span>
  )
}

export default async function PublicMaalemPage({ params, searchParams }: Props) {
  const [{ locale: rawLocale, id: rawId }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const id = positiveId(rawId)
  if (!id) notFound()
  const rawReviewsPage = Array.isArray(query.reviews_page) ? query.reviews_page[0] : query.reviews_page
  const reviewsPage = rawReviewsPage ? positiveId(rawReviewsPage) || 1 : 1
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
    { icon: CheckCircle2, tone: 'emerald' as Tone, value: closed, label: t('statInterventions') },
    maalem.experience_years != null ? { icon: Award, tone: 'amber' as Tone, value: maalem.experience_years, label: t('statExperience') } : null,
    maalem.statistics.review_count > 0 && maalem.statistics.average_rating != null
      ? { icon: Star, tone: 'amber' as Tone, value: maalem.statistics.average_rating, label: t('statRating') }
      : null,
    maalem.intervention_areas.length ? { icon: MapPin, tone: 'sky' as Tone, value: maalem.intervention_areas.length, label: t('statAreas') } : null,
    maalem.skills.length ? { icon: Layers, tone: 'violet' as Tone, value: maalem.skills.length, label: t('statSkills') } : null,
  ].filter(Boolean) as Array<{ icon: typeof Award; tone: Tone; value: number; label: string }>

  const trustPoints = [
    { icon: ShieldCheck, text: t('trustVerified') },
    { icon: CheckCircle2, text: t('trustProof') },
    { icon: Lock, text: t('trustPrivacy') },
  ]

  // Ancres de la barre de navigation : la page reste rendue cote serveur,
  // donc des liens de saut plutot que des onglets pilotes en JavaScript.
  const sectionLinks = [
    { href: '#about', label: t('about') },
    { href: '#coverage', label: t('areas') },
    { href: '#reviews', label: t('reviews') },
    { href: '#services', label: t('services') },
  ]

  return <main className="bg-white dark:bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

    <div className={`${SHELL} pb-16 pt-5 sm:pt-7`}>
      <Link href={`/${locale}/maalems`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30">
        <ArrowLeft className="size-4 rtl:rotate-180" />{t('back')}
      </Link>

      {/* ── Hero profil : banniere degradee + portrait en debord ── */}
      <header className="mt-3">
        <div
          className="h-32 w-full rounded-3xl bg-gradient-to-r from-emerald-200 via-emerald-100 to-amber-200 sm:h-44 dark:from-emerald-900/50 dark:via-emerald-950/60 dark:to-amber-900/40"
          aria-hidden="true"
        />

        <div className="-mt-14 px-2 sm:-mt-20 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-10">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-[28px] border-4 border-white bg-neutral-100 shadow-[0_10px_30px_-16px_rgba(16,24,40,.5)] sm:size-40 dark:border-card dark:bg-neutral-800">
              {photo ? (
                <Image src={photo} alt={maalem.public_name} fill sizes="(min-width: 640px) 160px, 112px" className="object-cover object-top" priority />
              ) : (
                <div className="flex size-full items-center justify-center text-4xl font-semibold text-neutral-400" role="img" aria-label={t('noPhoto')}>
                  {getMaalemInitials(maalem.public_name)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 lg:pb-1">
              <h1 className="flex flex-wrap items-center gap-x-3 gap-y-2 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                {maalem.public_name}
                <BadgeCheck className="size-7 shrink-0 fill-emerald-600 text-white dark:fill-emerald-500 dark:text-card" role="img" aria-label={t('verified')} />
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {category && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <BriefcaseBusiness className="size-3.5" aria-hidden="true" />{category}
                  </span>
                )}
                {maalem.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />{maalem.city}
                  </span>
                )}
                <PublicRating
                  rating={maalem.statistics.average_rating}
                  count={maalem.statistics.review_count}
                  locale={locale}
                  compact
                  labels={{ rating: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verified: t('verifiedReviews'), empty: t('reviewsEmpty') }}
                />
              </div>
            </div>

            {/* Chiffres cles alignes a droite, comme la maquette portfolio. */}
            {quickStats.length > 0 && (
              <dl className="flex flex-wrap gap-x-8 gap-y-4 lg:justify-end lg:pb-1" aria-label={t('quickStats')}>
                {quickStats.map((stat) => (
                  <div key={stat.label} className="min-w-20">
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <stat.icon className={`size-3.5 ${TONES[stat.tone].split(' ')[1]}`} aria-hidden="true" />{stat.label}
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <p className="mt-6 max-w-3xl whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
            {maalem.professional_summary || t('aboutFallback')}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-emerald-900 px-7 text-base font-medium text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600">
              <Link href={requestHref}>{t('cta')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-black/10 bg-white px-7 text-base font-medium text-foreground hover:bg-neutral-50 dark:border-white/15 dark:bg-transparent dark:hover:bg-white/10">
              <Link href={quickServiceRequestHref(locale)}>{t('quick')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Navigation de sections ── */}
      <nav className="mt-10 border-b border-black/[0.08] dark:border-white/10" aria-label={t('quickStats')}>
        <ul className="-mb-px flex flex-wrap gap-x-8">
          {sectionLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="inline-flex min-h-11 items-center border-b-2 border-transparent text-sm font-medium text-muted-foreground transition hover:border-emerald-700 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 dark:hover:border-emerald-400"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
        <div className="min-w-0 space-y-8">

          {/* ── Proof of work ── */}
          <section className={`${CARD} p-6 sm:p-8`} aria-labelledby="proof-heading">
            <div className="flex items-start gap-4">
              <SectionIcon icon={ShieldCheck} tone="emerald" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{t('proof')}</p>
                <h2 id="proof-heading" className="mt-1 text-2xl font-semibold tracking-tight">{t('closed', { count: closed })}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('proofText')}</p>
                {hasLastClosed && <p className="mt-3 text-xs text-muted-foreground">{t('lastClosed', { date: t('monthYear', { date: lastClosed! }) })}</p>}
              </div>
            </div>

            {/* Breakdown as proportional bars: shows where the experience actually is. */}
            {maalem.statistics.by_service.length > 0 && (
              <div className="mt-7 border-t border-black/[0.06] pt-6 dark:border-white/10">
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
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${width}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{t('statShare', { percent: share })}</p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* ── About + expertise ── */}
          <section id="about" className="scroll-mt-24 grid gap-6 md:grid-cols-2" aria-label={t('about')}>
            <article className={`${CARD} p-6 sm:p-8`}>
              <div className="flex items-center gap-3">
                <SectionIcon icon={Sparkles} tone="violet" />
                <h2 className="text-xl font-semibold tracking-tight">{t('about')}</h2>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
                {maalem.professional_summary || t('aboutFallback')}
              </p>
            </article>
            <article className={`${CARD} p-6 sm:p-8`}>
              <div className="flex items-center gap-3">
                <SectionIcon icon={BriefcaseBusiness} tone="amber" />
                <h2 className="text-xl font-semibold tracking-tight">{t('expertise')}</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{t('expertiseText')}</p>
              {maalem.skills.length ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {maalem.skills.map((skill) => (
                    <li key={skill} className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-4 text-sm text-muted-foreground">{t('skillsFallback')}</p>}
            </article>
          </section>

          {/* ── Coverage: declared areas ── */}
          <section id="coverage" className={`${CARD} scroll-mt-24 p-6 sm:p-8`} aria-labelledby="coverage-heading">
            <div className="flex items-center gap-3">
              <SectionIcon icon={MapPin} tone="sky" />
              <h2 id="coverage-heading" className="text-xl font-semibold tracking-tight">{t('areas')}</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t('coverageText')}</p>
            {maalem.intervention_areas.length ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {maalem.intervention_areas.map((area) => (
                  <li key={area} className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{area}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-5 rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-muted-foreground dark:border-white/15">{t('coverageEmpty')}</p>}
          </section>

          <section className={`${CARD} p-6 sm:p-8`}>
            <div className="flex items-center gap-3">
              <SectionIcon icon={Hammer} tone="rose" />
              <h2 className="text-lg font-semibold">{t('realizations')}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('realizationsEmpty')}</p>
          </section>

          {/* ── Avis : 5 par page, puis bouton "suivants" ── */}
          <section id="reviews" className={`${CARD} scroll-mt-24 p-6 sm:p-8`} aria-labelledby="reviews-heading">
            <div className="flex flex-col gap-5 border-b border-black/[0.06] pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
              <div className="flex items-start gap-3">
                <SectionIcon icon={Star} tone="amber" />
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
          <section id="services" className="scroll-mt-24" aria-labelledby="services-heading">
            <div className="flex items-center gap-3">
              <SectionIcon icon={Layers} tone="emerald" />
              <h2 id="services-heading" className="text-xl font-semibold tracking-tight">{t('services')}</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t('servicesText')}</p>
            {maalem.compatible_services.length ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {maalem.compatible_services.map((service) => (
                  <ServiceCard key={service.id} service={service} locale={locale} viewLabel={t('serviceView')} requestLabel={t('serviceRequest')} moreCategoriesLabel={t('moreCategories')} />
                ))}
              </div>
            ) : <p className="mt-6 rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-muted-foreground dark:border-white/15">{t('servicesEmpty')}</p>}
          </section>
        </div>

        {/* ── Sticky conversion rail ── */}
        <aside className="lg:sticky lg:top-24">
          <div className={`${CARD} overflow-hidden`}>
            <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-300" aria-hidden="true" />
            <div className="p-6">
              <h2 className="text-lg font-semibold leading-snug">{t('ctaTitle')}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('ctaText')}</p>
              <Button asChild size="lg" className="mt-6 h-auto min-h-12 w-full whitespace-normal rounded-full bg-emerald-900 px-4 py-3 font-medium text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                <Link href={requestHref}>{t('cta')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="mt-3 h-auto min-h-12 w-full whitespace-normal rounded-full border-black/10 bg-white text-foreground hover:bg-neutral-50 dark:border-white/15 dark:bg-transparent dark:hover:bg-white/10">
                <Link href={quickServiceRequestHref(locale)}>{t('quick')}</Link>
              </Button>
              <p className="mt-5 flex items-start gap-2 border-t border-black/[0.06] pt-4 text-xs leading-5 text-muted-foreground dark:border-white/10">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{t('privacy')}
              </p>
            </div>
          </div>

          {/* Trust panel: makes the platform's guarantees explicit next to the CTA. */}
          <div className={`${CARD} mt-6 p-6`}>
            <h2 className="text-sm font-semibold text-foreground">{t('trustTitle')}</h2>
            <ul className="mt-4 space-y-3.5">
              {trustPoints.map((point) => (
                <li key={point.text} className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
                  <point.icon className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  {point.text}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>

    {/* Mobile conversion bar */}
    <div className="sticky bottom-0 z-30 border-t border-black/[0.08] bg-white p-3 lg:hidden dark:border-white/10 dark:bg-background/95">
      <Button asChild className="min-h-12 w-full rounded-full bg-emerald-900 font-medium text-white hover:bg-emerald-800 dark:bg-emerald-700">
        <Link href={requestHref}>{t('cta')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
      </Button>
    </div>
  </main>
}

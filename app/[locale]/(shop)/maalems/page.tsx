import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, ChevronDown, Info, Search, ShieldCheck, SlidersHorizontal, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { CSSProperties } from 'react'

import { MaalemCardPortrait } from '@/components/maalems/maalem-card-portrait'
import { MaalemDirectoryCard } from '@/components/maalems/maalem-directory-card'
import { getMaalemInitials } from '@/components/service-requests/maalem-public-summary'
import { normalizeLocale } from '@/i18n/locale'
import { localizedCategoryName, quickServiceRequestHref } from '@/lib/service-catalog'
import { getPublicMaalems, resolvePublicMaalemPhoto } from '@/lib/service-requests'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo/site-json-ld'
import { CONTACT } from '@/lib/contact'
import { cn } from '@/lib/utils'

type Query = Record<string, string | string[] | undefined>
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
const integer = (value: string | undefined) => { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : undefined }

function href(locale: string, values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  const query = params.toString()
  return `/${locale}/maalems${query ? `?${query}` : ''}`
}

const PRIMARY = 'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-ink shadow-[0_14px_34px_-14px_rgba(242,159,4,0.75)] transition-[filter,transform] hover:brightness-105 active:scale-[0.98]'
const SECONDARY = 'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted'
const FIELD = 'grid min-w-0 gap-2 text-xs font-semibold text-foreground/75'
const INPUT = 'h-12 w-full min-w-0 rounded-xl border border-border bg-background px-3.5 text-sm font-normal text-foreground outline-none transition-[border-color,box-shadow] focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/25'
const ARROW = 'size-4 shrink-0 rtl:rotate-180'
const delay = (ms: number) => ({ ['--reveal-delay' as string]: `${ms}ms` }) as CSSProperties

const STEPS = [
  { number: '01', image: '/utility-types/professional-workshop.webp' },
  { number: '02', image: '/utility-types/home-diy-workshop.webp' },
  { number: '03', image: '/videos/villa/poster-end.webp' },
] as const

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Query> }): Promise<Metadata> {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const t = await getTranslations({ locale, namespace: 'maalemsPage' })
  const filtered = ['q', 'category_id', 'service_id', 'city', 'zone', 'min_experience', 'min_interventions', 'min_rating'].some((key) => Boolean(first(query[key])))
    || (first(query.sort) && first(query.sort) !== 'recommended') || (integer(first(query.page)) || 1) > 1
  return buildPageMetadata({ locale, title: t('metadataTitle'), description: t('metadataDescription'), path: '/maalems', indexable: !filtered })
}

export default async function MaalemsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Query> }) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const [t, tx] = await Promise.all([
    getTranslations({ locale, namespace: 'maalemsPage' }),
    getTranslations({ locale, namespace: 'xp.maalems' }),
  ])
  const filters = {
    q: (first(query.q) || '').trim().slice(0, 100), category_id: integer(first(query.category_id)), service_id: integer(first(query.service_id)),
    city: (first(query.city) || '').trim().slice(0, 100), zone: (first(query.zone) || '').trim().slice(0, 100),
    min_experience: integer(first(query.min_experience)), min_interventions: integer(first(query.min_interventions)),
    min_rating: integer(first(query.min_rating)),
    sort: first(query.sort) || 'recommended', page: integer(first(query.page)) || 1, per_page: 12,
  }
  let data = null
  try { data = await getPublicMaalems(filters) } catch { /* Render a useful retry state. */ }
  const hasFilters = Boolean(filters.q || filters.category_id || filters.service_id || filters.city || filters.zone || filters.min_experience || filters.min_interventions || filters.min_rating || filters.sort !== 'recommended')
  const hasAdvancedFilters = Boolean(filters.city || filters.zone || filters.min_experience || filters.min_interventions || filters.min_rating || filters.sort !== 'recommended')
  const returnTo = href(locale, filters)
  const labels = { verified: t('verified'), city: t('city'), areas: t('areas'), experience: t('experienceLabel', { years: '{years}' }), noPhoto: t('noPhoto'), interventions: t('interventionsLabel', { count: '{count}' }), declared: t('declared'), profile: t('profile'), request: t('request'), ratingLabel: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verifiedReviews: t('verifiedReviews'), noReviews: t('noReviews') }

  const searchHref = `/${locale}/maalems`
  const quickHref = quickServiceRequestHref(locale, returnTo)
  const number = new Intl.NumberFormat(locale)

  // Real figures only: what the public directory currently returns.
  const stats = data && !hasFilters ? [
    { label: tx('statMaalems'), value: data.pagination.total_items },
    { label: tx('statTrades'), value: data.filters.categories.length },
    { label: tx('statServices'), value: data.filters.services.length },
  ].filter((stat) => stat.value > 0) : []

  // The first recommended profile with a public photo, shown beside the hero.
  const spotlight = data?.maalems.find((maalem) => resolvePublicMaalemPhoto(maalem.photo_url))
  const spotlightCategory = spotlight ? (locale === 'ar' ? spotlight.category.name_ar || spotlight.category.name : spotlight.category.name || spotlight.category.name_ar) : ''
  const spotlightRating = spotlight && spotlight.statistics.average_rating != null && spotlight.statistics.review_count > 0
    ? new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.min(5, Math.max(1, spotlight.statistics.average_rating)))
    : null

  return <div className="bg-background text-foreground" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(locale, [{ name: CONTACT.name, path: '/' }, { name: t('metadataTitle'), path: '/maalems' }])) }} />
    {/* ── Hero ─────────────────────────────────────────────── */}
    <section className="relative isolate overflow-hidden bg-[#f2f1ed] text-ink dark:bg-ink dark:text-white" aria-labelledby="maalems-title">
      <div className="bd-grid absolute inset-0 -z-10 opacity-70 [--grid-color:rgba(13,13,13,0.05)] [background-size:96px_96px] dark:[--grid-color:rgba(255,255,255,0.035)]" aria-hidden="true" />
      <div className="absolute -top-48 end-[-12%] -z-10 size-[680px] rounded-full bg-[radial-gradient(closest-side,rgba(242,159,4,0.22),transparent)]" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-28 pt-10 sm:px-8 lg:grid-cols-[1fr_1.08fr] lg:items-center lg:gap-16 lg:px-10 lg:pb-36 lg:pt-16">
        <div className="min-w-0">
          <p className="kicker flex items-center gap-3"><span className="h-px w-10 bg-current" aria-hidden="true" />{t('eyebrow')}</p>
          <h1 id="maalems-title" className="display-lg mt-6 max-w-[13ch] text-[2.7rem] sm:text-6xl lg:text-[4.5rem]">
            {t('title')} <span className="hero-accent">{t('titleAccent')}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70 dark:text-white/70">{t('description')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#find-maalem" className={PRIMARY}>{t('explore')}<ArrowRight className={ARROW} aria-hidden="true" /></a>
            <Link href={quickHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink/20 bg-white/70 px-6 text-sm font-semibold text-ink backdrop-blur-md transition-colors hover:border-ink/50 hover:bg-white dark:border-white/20 dark:bg-white/[0.04] dark:text-white dark:hover:border-white/50 dark:hover:bg-white/10">
              {t('quick')}<ArrowUpRight className="size-4 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </div>
          {stats.length > 0 && <dl className="mt-11 grid max-w-lg grid-cols-3 border-t border-ink/10 pt-6 dark:border-white/10">
            {stats.map((stat, index) => <div key={stat.label} className={cn('flex flex-col-reverse gap-1', index > 0 && 'border-s border-ink/10 ps-5 dark:border-white/10')}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/55 rtl:tracking-normal dark:text-white/55">{stat.label}</dt>
              <dd className="display-lg tabular text-3xl sm:text-4xl">{number.format(stat.value)}</dd>
            </div>)}
          </dl>}
        </div>

        <div className="relative min-w-0">
          <div className="grid h-[340px] grid-cols-6 grid-rows-6 gap-3 sm:h-[460px] lg:h-[560px]">
            <figure className="group relative col-span-6 row-span-6 overflow-hidden rounded-[2rem] bg-ink/10 sm:col-span-4">
              <Image src="/utility-types/professionnel-atelier-editorial-2026.webp" alt={t('heroAlt')} fill priority sizes="(min-width: 1024px) 36vw, (min-width: 640px) 64vw, 100vw" className="object-cover object-[35%_center] transition-transform duration-[1400ms] ease-[var(--ease-premium)] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" aria-hidden="true" />
              <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-ink/55 p-4 text-white backdrop-blur-xl">
                <div className="min-w-0"><strong className="block text-[15px] font-semibold">{t('heroCaption')}</strong><span className="mt-0.5 block text-xs text-white/70">{t('heroCaptionDetail')}</span></div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-ink" aria-hidden="true"><ArrowUpRight className="size-5 rtl:-scale-x-100" /></span>
              </figcaption>
            </figure>
            <div className="relative col-span-2 row-span-3 hidden overflow-hidden rounded-[1.6rem] bg-ink/10 sm:block">
              <Image src="/utility-types/maison-diy-editorial-2026.webp" alt="" fill sizes="(min-width: 1024px) 18vw, 32vw" className="object-cover object-[60%_center]" />
            </div>
            <div className="relative col-span-2 row-span-3 hidden overflow-hidden rounded-[1.6rem] bg-ink/10 sm:block">
              <Image src="/videos/villa/poster-start.webp" alt="" fill sizes="(min-width: 1024px) 18vw, 32vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/45 to-transparent" aria-hidden="true" />
            </div>
          </div>

          {spotlight && <Link
            href={`/${locale}/maalems/${spotlight.id}`}
            className="absolute -top-5 start-4 z-10 hidden w-[290px] items-center gap-3 rounded-2xl border border-border bg-background/95 p-3 text-foreground shadow-[0_30px_60px_-28px_rgba(13,13,13,0.55)] backdrop-blur-xl transition-transform duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 sm:flex lg:-start-10 lg:top-10"
          >
            <span className="group relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              <MaalemCardPortrait src={resolvePublicMaalemPhoto(spotlight.photo_url)} name={spotlight.public_name} initials={getMaalemInitials(spotlight.public_name)} fallbackLabel={t('noPhoto')} sizes="56px" compact />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-accent-text rtl:tracking-normal">{t('recommended')}</span>
              <span className="flex items-center gap-1 text-sm font-semibold">
                <span className="truncate">{spotlight.public_name}</span>
                {spotlight.is_verified && <BadgeCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" role="img" aria-label={t('verified')} />}
              </span>
              <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <span className="truncate">{spotlightCategory}</span>
                {spotlightRating && <><span aria-hidden="true">·</span><Star className="size-3 shrink-0 fill-amber-500 text-amber-500" aria-hidden="true" /><span className="tabular">{spotlightRating}</span></>}
              </span>
            </span>
          </Link>}
        </div>
      </div>
    </section>

    <div className="relative z-10 mx-auto -mt-16 max-w-[1440px] px-5 sm:px-8 lg:-mt-20 lg:px-10">
      {/* ── Search ─────────────────────────────────────────── */}
      <section id="find-maalem" className="scroll-mt-32 rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_40px_90px_-50px_rgba(13,13,13,0.5)] sm:p-7" aria-labelledby="search-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker flex items-center gap-3"><span className="h-px w-8 bg-[var(--accent-text)]" aria-hidden="true" />{t('searchHint')}</p>
            <h2 id="search-heading" className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{t('searchTitle')}</h2>
          </div>
        </div>
        <form action={searchHref} method="get">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
            <label className={FIELD}>{t('search')}<span className="relative"><Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input name="q" defaultValue={filters.q} placeholder={t('searchPlaceholder')} className={cn(INPUT, 'ps-10')} /></span></label>
            <label className={FIELD}>{t('category')}<select name="category_id" defaultValue={filters.category_id || ''} className={INPUT}><option value="">{t('allCategories')}</option>{data?.filters.categories.map(item => <option key={item.id} value={item.id}>{localizedCategoryName(item, locale)}</option>)}</select></label>
            <label className={FIELD}>{t('service')}<select name="service_id" defaultValue={filters.service_id || ''} className={INPUT}><option value="">{t('allServices')}</option>{data?.filters.services.map(item => <option key={item.id} value={item.id}>{localizedCategoryName(item, locale)}</option>)}</select></label>
            <button type="submit" className={cn(PRIMARY, 'md:col-span-3 lg:col-span-1')}><Search className="size-4 shrink-0" aria-hidden="true" />{t('submit')}</button>
          </div>
          <details className="group/adv mt-5 border-t border-border pt-1" open={hasAdvancedFilters}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal className="size-4 shrink-0 text-accent-text" aria-hidden="true" />{t('advancedFilters')}
              <span className="ms-auto text-xs font-normal text-muted-foreground">{hasAdvancedFilters ? t('activeAdvancedFilters') : t('optionalFilters')}</span>
              <ChevronDown className="size-4 shrink-0 transition-transform group-open/adv:rotate-180" aria-hidden="true" />
            </summary>
            <div className="grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className={FIELD}>{t('city')}<input name="city" defaultValue={filters.city} className={INPUT} /></label>
              <label className={FIELD}>{t('zone')}<input name="zone" defaultValue={filters.zone} className={INPUT} /></label>
              <label className={FIELD}>{t('experience')}<input type="number" min="0" max="70" name="min_experience" defaultValue={filters.min_experience} className={INPUT} /></label>
              <label className={FIELD}>{t('interventions')}<input type="number" min="0" name="min_interventions" defaultValue={filters.min_interventions} className={INPUT} /></label>
              <label className={FIELD}>{t('minimumRating')}<select name="min_rating" defaultValue={filters.min_rating || ''} className={INPUT}><option value="">{t('allRatings')}</option>{[5,4,3,2,1].map(rating => <option key={rating} value={rating}>{t('minimumRatingOption', { rating })}</option>)}</select></label>
              <label className={FIELD}>{t('sort')}<select name="sort" defaultValue={filters.sort} className={INPUT}><option value="recommended">{t('recommended')}</option><option value="rating_desc">{t('ratingSort')}</option><option value="interventions_desc">{t('interventionsSort')}</option><option value="experience_desc">{t('experienceSort')}</option><option value="name_asc">{t('nameSort')}</option></select></label>
            </div>
            <div className="flex flex-wrap items-center gap-4 pb-2 pt-5"><button type="submit" className={SECONDARY}>{t('applyAdvancedFilters')}</button><p className="text-xs text-muted-foreground">{filters.sort === 'rating_desc' ? t('ratingSortNotice', { count: data?.filters.rating_sort_min_reviews || 3 }) : t('sortNotice', { sort: t(filters.sort === 'recommended' ? 'recommended' : filters.sort === 'interventions_desc' ? 'interventionsSort' : filters.sort === 'experience_desc' ? 'experienceSort' : 'nameSort') })}</p></div>
          </details>
          {hasFilters && <Link href={searchHref} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold underline decoration-[var(--accent-text)] underline-offset-[6px]">{t('reset')}</Link>}
        </form>
      </section>

      {/* ── Trades ─────────────────────────────────────────── */}
      {Boolean(data?.filters.categories.length) && <nav className="mt-7 flex items-center gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={t('browseCategories')}>
        <span className="me-1 shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground rtl:tracking-normal">{t('browseCategories')}</span>
        {data?.filters.categories.slice(0, 8).map(category => {
          const current = filters.category_id === category.id
          return <Link key={category.id} aria-current={current ? 'true' : undefined} href={`${href(locale, { ...filters, category_id: category.id, service_id: undefined, page: undefined, per_page: undefined })}#directory`}
            className={cn('inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors', current ? 'border-transparent bg-ink text-white dark:bg-brand-yellow dark:text-ink' : 'border-border bg-card hover:border-[var(--accent-text)] hover:text-accent-text')}>
            {localizedCategoryName(category, locale)}<ArrowUpRight className="size-3.5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        })}
      </nav>}

      {/* ── Directory ──────────────────────────────────────── */}
      <section id="directory" className="scroll-mt-32 pt-14 lg:pt-20" aria-labelledby="directory-heading">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
          <div className="min-w-0">
            <p className="kicker flex items-center gap-3" data-reveal><span className="h-px w-8 bg-[var(--accent-text)]" aria-hidden="true" />{t('directoryEyebrow')}</p>
            <h2 id="directory-heading" className="display-lg mt-4 max-w-[20ch] text-[2.1rem] sm:text-5xl" data-reveal style={delay(80)}>{t('directoryTitle')}</h2>
          </div>
          {data && <p className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-muted px-4 text-sm font-semibold" aria-live="polite"><span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />{t('count', { count: data.pagination.total_items })}</p>}
        </div>
        <p className="flex items-center gap-2 py-5 text-xs leading-relaxed text-muted-foreground"><Info className="size-3.5 shrink-0" aria-hidden="true" />{t('declared')}</p>

        {!data ? <div className="rounded-[1.6rem] border border-dashed border-border px-6 py-14 text-center" role="alert">
            <ShieldCheck className="mx-auto mb-4 size-8 text-accent-text" aria-hidden="true" />
            <h3 className="text-xl font-semibold">{t('error')}</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{t('quickDescription')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href={href(locale, filters)} className={SECONDARY}>{t('retry')}</Link><Link href={quickHref} className={PRIMARY}>{t('quick')}<ArrowRight className={ARROW} aria-hidden="true" /></Link></div>
          </div>
          : data.maalems.length === 0 ? <div className="rounded-[1.6rem] border border-dashed border-border px-6 py-14 text-center">
            <Search className="mx-auto mb-4 size-8 text-accent-text" aria-hidden="true" />
            <h3 className="text-xl font-semibold">{t('empty')}</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{t('emptyHint')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">{hasFilters && <Link href={searchHref} className={SECONDARY}>{t('reset')}</Link>}<Link href={quickHref} className={PRIMARY}>{t('quick')}<ArrowRight className={ARROW} aria-hidden="true" /></Link></div>
          </div>
          : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.maalems.map((maalem, index) => <MaalemDirectoryCard key={maalem.id} maalem={maalem} locale={locale} stats={maalem.statistics} labels={labels} index={index} />)}</div>}

        {data && data.pagination.total_pages > 1 && <nav className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm" aria-label={t('pagination')}>
          {data.pagination.has_previous ? <Link className={SECONDARY} href={href(locale, { ...filters, page: data.pagination.current_page - 1, per_page: undefined })}><ArrowLeft className={ARROW} aria-hidden="true" />{t('previous')}</Link> : <span className={cn(SECONDARY, 'pointer-events-none opacity-45')} aria-disabled="true"><ArrowLeft className={ARROW} aria-hidden="true" />{t('previous')}</span>}
          <span className="tabular rounded-full bg-muted px-4 py-2 font-semibold">{t('page', { page: data.pagination.current_page })} / {data.pagination.total_pages}</span>
          {data.pagination.has_next ? <Link className={SECONDARY} href={href(locale, { ...filters, page: data.pagination.current_page + 1, per_page: undefined })}>{t('next')}<ArrowRight className={ARROW} aria-hidden="true" /></Link> : <span className={cn(SECONDARY, 'pointer-events-none opacity-45')} aria-disabled="true">{t('next')}<ArrowRight className={ARROW} aria-hidden="true" /></span>}
        </nav>}
      </section>
    </div>

    {/* ── How it works ─────────────────────────────────────── */}
    <section className="relative mt-20 overflow-hidden bg-ink py-20 text-white lg:mt-28 lg:py-28" aria-labelledby="how-heading">
      <div className="absolute inset-0 bg-[radial-gradient(50%_70%_at_100%_0%,rgba(242,159,4,0.2),transparent_70%)]" aria-hidden="true" />
      <div className="bd-grid absolute inset-0 opacity-50 [--grid-color:rgba(255,255,255,0.03)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <p className="kicker flex items-center gap-3 !text-brand-yellow" data-reveal><span className="h-px w-8 bg-brand-yellow" aria-hidden="true" />{t('howEyebrow')}</p>
        <h2 id="how-heading" className="display-lg mt-4 max-w-[18ch] text-[2.1rem] text-white sm:text-5xl lg:text-[3.6rem]" data-reveal style={delay(80)}>{t('howTitle')}</h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => <li key={step.number} className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03] transition-colors duration-500 hover:border-[rgba(242,159,4,0.5)]" data-reveal style={delay(index * 120)}>
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image src={step.image} alt="" fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover opacity-75 transition-[transform,opacity] duration-[900ms] ease-[var(--ease-premium)] group-hover:scale-105 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" aria-hidden="true" />
              <span className="text-gold tabular absolute bottom-3 start-5 text-6xl font-extrabold leading-none" aria-hidden="true">{step.number}</span>
            </div>
            <div className="p-6 pt-4">
              <h3 className="text-lg font-semibold">{t(`step${index + 1}Title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{t(`step${index + 1}Description`)}</p>
            </div>
          </li>)}
        </ol>
      </div>
    </section>

    {/* ── Final call to action ─────────────────────────────── */}
    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24" aria-labelledby="maalems-cta">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-white sm:px-12 lg:px-16 lg:py-20" data-reveal>
        <Image src="/videos/villa/poster-end.webp" alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="-z-10 object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,#0d0d0d_12%,rgba(13,13,13,0.78)_55%,rgba(13,13,13,0.3))] rtl:bg-[linear-gradient(260deg,#0d0d0d_12%,rgba(13,13,13,0.78)_55%,rgba(13,13,13,0.3))]" aria-hidden="true" />
        <div className="max-w-2xl">
          <h2 id="maalems-cta" className="display-lg text-[2rem] sm:text-5xl">{tx.rich('ctaTitle', { accent: (chunks) => <span className="text-gold">{chunks}</span> })}</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">{t('quickDescription')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={quickHref} className={PRIMARY}>{t('quick')}<ArrowRight className={ARROW} aria-hidden="true" /></Link>
            <Link href={`/${locale}/services`} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10">{tx('ctaServices')}<ArrowUpRight className="size-4 shrink-0 rtl:-scale-x-100" aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  </div>
}

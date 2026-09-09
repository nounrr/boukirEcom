import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { MaalemDirectoryCard } from '@/components/maalems/maalem-directory-card'
import { Button } from '@/components/ui/button'
import { normalizeLocale } from '@/i18n/locale'
import { localizedCategoryName, quickServiceRequestHref } from '@/lib/service-catalog'
import { getPublicMaalems } from '@/lib/service-requests'
import { buildPageMetadata } from '@/lib/seo/metadata'

type Query = Record<string, string | string[] | undefined>
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
const integer = (value: string | undefined) => { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : undefined }

function href(locale: string, values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  const query = params.toString()
  return `/${locale}/maalems${query ? `?${query}` : ''}`
}

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
  const t = await getTranslations({ locale, namespace: 'maalemsPage' })
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
  const labels = { verified: t('verified'), city: t('city'), areas: t('areas'), experience: t('experienceLabel', { years: '{years}' }), noPhoto: t('noPhoto'), interventions: t('interventionsLabel', { count: '{count}' }), declared: t('declared'), profile: t('profile'), request: t('request'), ratingLabel: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verifiedReviews: t('verifiedReviews'), noReviews: t('noReviews') }

  return <main className="min-h-[70vh] bg-[#fbf8ef] dark:bg-background py-10 dark:bg-background sm:py-14">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="grid gap-6 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl"><p className="flex items-center gap-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"><ShieldCheck className="size-5" aria-hidden="true" /></span>{t('eyebrow')}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{t('title')}</h1><p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{t('description')}</p></div>
        {data && <p className="w-fit rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300" aria-live="polite">{t('count', { count: data.pagination.total_items })}</p>}
      </header>

      <section className="rounded-2xl border border-amber-900/10 bg-card p-5 shadow-[0_12px_30px_-22px_rgba(83,60,19,.3)] sm:p-6 dark:border-border" aria-label={t('search')}>
        <form action={`/${locale}/maalems`}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(180px,.75fr)_minmax(180px,.75fr)_auto] lg:items-end">
            <label className="grid min-w-0 gap-2 text-xs font-medium">{t('search')}<span className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-amber-700" aria-hidden="true" /><input suppressHydrationWarning name="q" defaultValue={filters.q} className="h-11 w-full rounded-[6px] border border-input bg-background px-9 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15" /></span></label>
            <label className="grid min-w-0 gap-2 text-xs font-medium">{t('category')}<select name="category_id" defaultValue={filters.category_id || ''} className="h-11 rounded-[6px] border border-input bg-background px-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"><option value="">{t('allCategories')}</option>{data?.filters.categories.map((item) => <option key={item.id} value={item.id}>{localizedCategoryName(item, locale)}</option>)}</select></label>
            <label className="grid min-w-0 gap-2 text-xs font-medium">{t('service')}<select name="service_id" defaultValue={filters.service_id || ''} className="h-11 rounded-[6px] border border-input bg-background px-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"><option value="">{t('allServices')}</option>{data?.filters.services.map((item) => <option key={item.id} value={item.id}>{localizedCategoryName(item, locale)}</option>)}</select></label>
            <div className="flex gap-2"><Button type="submit" className="min-h-11 rounded-md bg-amber-400 px-5 text-emerald-950 hover:bg-amber-300 dark:bg-amber-400 dark:text-emerald-950 dark:hover:bg-amber-300"><Search className="size-4" />{t('submit')}</Button>{hasFilters && <Button asChild variant="outline" className="min-h-11 rounded-[6px]"><Link href={`/${locale}/maalems`}>{t('reset')}</Link></Button>}</div>
          </div>

          <details className="group mt-4 border-t border-border pt-4 dark:border-border" open={hasAdvancedFilters}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />{t('advancedFilters')}
              <span className="ms-auto text-xs font-normal text-muted-foreground">{hasAdvancedFilters ? t('activeAdvancedFilters') : t('optionalFilters')}</span>
            </summary>
            <div className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <label className="grid min-w-0 gap-2 text-xs font-medium">{t('city')}<input suppressHydrationWarning name="city" defaultValue={filters.city} className="h-11 rounded-[6px] border border-input bg-background px-3" /></label>
              <label className="grid min-w-0 gap-2 text-xs font-medium">{t('zone')}<input suppressHydrationWarning name="zone" defaultValue={filters.zone} className="h-11 rounded-[6px] border border-input bg-background px-3" /></label>
              <label className="grid min-w-0 gap-2 text-xs font-medium">{t('experience')}<input suppressHydrationWarning type="number" min="0" max="70" name="min_experience" defaultValue={filters.min_experience} className="h-11 rounded-[6px] border border-input bg-background px-3" /></label>
              <label className="grid min-w-0 gap-2 text-xs font-medium">{t('interventions')}<input suppressHydrationWarning type="number" min="0" name="min_interventions" defaultValue={filters.min_interventions} className="h-11 rounded-[6px] border border-input bg-background px-3" /></label>
              <label className="grid min-w-0 gap-2 text-xs font-medium">{t('minimumRating')}<select name="min_rating" defaultValue={filters.min_rating || ''} className="h-11 rounded-[6px] border border-input bg-background px-3"><option value="">{t('allRatings')}</option>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{t('minimumRatingOption', { rating })}</option>)}</select></label>
              <label className="grid min-w-0 gap-2 text-xs font-medium">{t('sort')}<select name="sort" defaultValue={filters.sort} className="h-11 rounded-[6px] border border-input bg-background px-3"><option value="recommended">{t('recommended')}</option><option value="rating_desc">{t('ratingSort')}</option><option value="interventions_desc">{t('interventionsSort')}</option><option value="experience_desc">{t('experienceSort')}</option><option value="name_asc">{t('nameSort')}</option></select></label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="submit" variant="outline" className="min-h-11 rounded-[6px]">{t('applyAdvancedFilters')}</Button><p className="text-xs leading-5 text-muted-foreground">{filters.sort === 'rating_desc' ? t('ratingSortNotice', { count: data?.filters.rating_sort_min_reviews || 3 }) : t('sortNotice', { sort: t(filters.sort === 'recommended' ? 'recommended' : filters.sort === 'interventions_desc' ? 'interventionsSort' : filters.sort === 'experience_desc' ? 'experienceSort' : 'nameSort') })}</p></div>
          </details>
        </form>
      </section>

      {!data ? (
        <section className="mt-8 rounded-lg border border-border bg-card p-5  sm:flex sm:items-center sm:gap-5 sm:p-6 dark:border-border" role="alert">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"><ShieldCheck className="size-5" aria-hidden="true" /></span>
          <div className="mt-4 min-w-0 flex-1 sm:mt-0"><p className="font-semibold">{t('error')}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{t('quickDescription')}</p></div>
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
            <Button asChild variant="outline" className="min-h-11 rounded-[6px]"><Link href={href(locale, filters)}>{t('submit')}</Link></Button>
            <Button asChild className="min-h-11 rounded-[6px]"><Link href={quickServiceRequestHref(locale)}>{t('quick')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link></Button>
          </div>
        </section>
      ) : data.maalems.length === 0 ? (
        <section className="mt-10 rounded-lg border border-dashed border-border bg-card p-8 text-center sm:p-10"><p className="font-semibold">{t('empty')}</p>{hasFilters && <Button asChild variant="outline" className="mt-5 min-h-11 rounded-[6px]"><Link href={`/${locale}/maalems`}>{t('reset')}</Link></Button>}</section>
      ) : (
        <section className="mt-8"><p className="mb-5 text-sm leading-6 text-muted-foreground">{t('declared')}</p><div className="grid gap-5 lg:grid-cols-2">{data.maalems.map((maalem) => <MaalemDirectoryCard key={maalem.id} maalem={maalem} locale={locale} stats={maalem.statistics} labels={labels} />)}</div></section>
      )}

      {data && <aside className="mt-12 flex flex-col gap-5 rounded-2xl border border-emerald-900/20 bg-emerald-950 p-6 text-white shadow-[0_16px_36px_-24px_rgba(6,78,59,.5)] sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><h2 className="text-xl font-semibold">{t('quick')}</h2><p className="mt-2 text-sm text-white/75">{t('quickDescription')}</p></div><Button asChild className="min-h-11 rounded-md bg-amber-400 text-emerald-950 hover:bg-amber-300 dark:bg-amber-400 dark:text-emerald-950 dark:hover:bg-amber-300"><Link href={quickServiceRequestHref(locale)}>{t('quick')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button></aside>}

      {data && data.pagination.total_pages > 1 && <nav className="mt-9 flex flex-wrap items-center justify-center gap-3" aria-label={t('pagination')}><Button asChild variant="outline" className={!data.pagination.has_previous ? 'pointer-events-none opacity-50' : ''}><Link href={href(locale, { ...filters, page: Math.max(1, data.pagination.current_page - 1), per_page: undefined })}><ArrowLeft className="size-4 rtl:rotate-180" />{t('previous')}</Link></Button><span className="text-sm font-semibold">{t('page', { page: data.pagination.current_page })} / {data.pagination.total_pages}</span><Button asChild variant="outline" className={!data.pagination.has_next ? 'pointer-events-none opacity-50' : ''}><Link href={href(locale, { ...filters, page: data.pagination.current_page + 1, per_page: undefined })}>{t('next')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button></nav>}
    </div>
  </main>
}

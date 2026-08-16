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
  const filtered = ['q', 'category_id', 'service_id', 'city', 'zone', 'min_experience', 'min_interventions'].some((key) => Boolean(first(query[key])))
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
    sort: first(query.sort) || 'recommended', page: integer(first(query.page)) || 1, per_page: 12,
  }
  let data = null
  try { data = await getPublicMaalems(filters) } catch { /* Render a useful retry state. */ }
  const hasFilters = Boolean(filters.q || filters.category_id || filters.service_id || filters.city || filters.zone || filters.min_experience || filters.min_interventions || filters.sort !== 'recommended')
  const labels = { verified: t('verified'), city: t('city'), areas: t('areas'), experience: t('experienceLabel', { years: '{years}' }), noPhoto: t('noPhoto'), interventions: t('interventionsLabel', { count: '{count}' }), declared: t('declared'), profile: t('profile'), request: t('request') }

  return <main className="min-h-[70vh] bg-[#fbf8ef] py-10 dark:bg-background sm:py-14">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="grid gap-6 border-b border-amber-900/15 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-emerald-800"><ShieldCheck className="size-4" />{t('eyebrow')}</p><h1 className="mt-4 text-4xl font-black tracking-[-.035em] sm:text-5xl lg:text-6xl">{t('title')}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{t('description')}</p></div>
        {data && <p className="border-s-2 border-amber-500 ps-4 text-sm font-semibold" aria-live="polite">{t('count', { count: data.pagination.total_items })}</p>}
      </header>

      <section className="border border-amber-200 bg-card p-4 shadow-[0_18px_45px_-35px_rgba(75,55,20,.55)] sm:p-5" aria-label={t('search')}>
        <form action={`/${locale}/maalems`} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold">{t('search')}<span className="relative"><Search className="absolute start-3 top-3.5 size-4 text-muted-foreground" /><input name="q" defaultValue={filters.q} className="h-11 w-full border border-input bg-background px-9" /></span></label>
          <label className="grid gap-1 text-sm font-semibold">{t('category')}<select name="category_id" defaultValue={filters.category_id || ''} className="h-11 border border-input bg-background px-3"><option value="">{t('allCategories')}</option>{data?.filters.categories.map((item) => <option key={item.id} value={item.id}>{localizedCategoryName(item, locale)}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">{t('service')}<select name="service_id" defaultValue={filters.service_id || ''} className="h-11 border border-input bg-background px-3"><option value="">{t('allServices')}</option>{data?.filters.services.map((item) => <option key={item.id} value={item.id}>{localizedCategoryName(item, locale)}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">{t('city')}<input name="city" defaultValue={filters.city} className="h-11 border border-input bg-background px-3" /></label>
          <label className="grid gap-1 text-sm font-semibold">{t('zone')}<input name="zone" defaultValue={filters.zone} className="h-11 border border-input bg-background px-3" /></label>
          <label className="grid gap-1 text-sm font-semibold">{t('experience')}<input type="number" min="0" max="70" name="min_experience" defaultValue={filters.min_experience} className="h-11 border border-input bg-background px-3" /></label>
          <label className="grid gap-1 text-sm font-semibold">{t('interventions')}<input type="number" min="0" name="min_interventions" defaultValue={filters.min_interventions} className="h-11 border border-input bg-background px-3" /></label>
          <label className="grid gap-1 text-sm font-semibold">{t('sort')}<select name="sort" defaultValue={filters.sort} className="h-11 border border-input bg-background px-3"><option value="recommended">{t('recommended')}</option><option value="interventions_desc">{t('interventionsSort')}</option><option value="experience_desc">{t('experienceSort')}</option><option value="name_asc">{t('nameSort')}</option></select></label>
          <div className="flex flex-wrap items-end gap-2 lg:col-span-4"><Button type="submit"><SlidersHorizontal className="size-4" />{t('submit')}</Button>{hasFilters && <Button asChild variant="outline"><Link href={`/${locale}/maalems`}>{t('reset')}</Link></Button>}<p className="ms-auto text-xs text-muted-foreground">{t('sortNotice', { sort: t(filters.sort === 'recommended' ? 'recommended' : filters.sort === 'interventions_desc' ? 'interventionsSort' : filters.sort === 'experience_desc' ? 'experienceSort' : 'nameSort') })}</p></div>
        </form>
      </section>

      {!data ? <section className="mt-10 border border-destructive/25 bg-card p-10 text-center" role="alert"><p className="font-bold">{t('error')}</p><Button asChild variant="outline" className="mt-5"><Link href={href(locale, filters)}>{t('submit')}</Link></Button></section> : data.maalems.length === 0 ? <section className="mt-10 border border-dashed border-amber-300 bg-card p-12 text-center"><p className="font-bold">{t('empty')}</p>{hasFilters && <Button asChild variant="outline" className="mt-5"><Link href={`/${locale}/maalems`}>{t('reset')}</Link></Button>}</section> : <section className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.maalems.map((maalem) => <MaalemDirectoryCard key={maalem.id} maalem={maalem} locale={locale} stats={maalem.statistics} labels={labels} />)}</section>}

      <aside className="mt-10 flex flex-col gap-4 border border-emerald-800/20 bg-emerald-950 px-6 py-7 text-white sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">{t('quick')}</h2><p className="mt-1 text-sm text-white/70">{t('quickDescription')}</p></div><Button asChild className="bg-amber-400 text-emerald-950 hover:bg-amber-300"><Link href={quickServiceRequestHref(locale)}>{t('quick')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button></aside>

      {data && data.pagination.total_pages > 1 && <nav className="mt-9 flex items-center justify-center gap-3" aria-label={t('pagination')}><Button asChild variant="outline" className={!data.pagination.has_previous ? 'pointer-events-none opacity-50' : ''}><Link href={href(locale, { ...filters, page: Math.max(1, data.pagination.current_page - 1), per_page: undefined })}><ArrowLeft className="size-4 rtl:rotate-180" />{t('previous')}</Link></Button><span className="text-sm font-semibold">{t('page', { page: data.pagination.current_page })} / {data.pagination.total_pages}</span><Button asChild variant="outline" className={!data.pagination.has_next ? 'pointer-events-none opacity-50' : ''}><Link href={href(locale, { ...filters, page: data.pagination.current_page + 1, per_page: undefined })}>{t('next')}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button></nav>}
    </div>
  </main>
}

import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Compass, Search, SlidersHorizontal, Wrench } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ServiceCard } from '@/components/services/service-card'
import { Button } from '@/components/ui/button'
import { normalizeLocale } from '@/i18n/locale'
import { catalogueHref, localizedCategoryName, quickServiceRequestHref } from '@/lib/service-catalog'
import { getActiveServices } from '@/lib/service-requests'
import { buildPageMetadata } from '@/lib/seo/metadata'
import type { PublicServicesResponse } from '@/types/service-request'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function positiveInteger(value: string | undefined) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

function visiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const values = new Set([1, total, current - 1, current, current + 1])
  return [...values].filter((page) => page > 0 && page <= total).sort((a, b) => a - b)
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}): Promise<Metadata> {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const t = await getTranslations({ locale, namespace: 'servicesPage' })
  const page = positiveInteger(first(query.page)) || 1
  const indexable = !first(query.q)?.trim() && !first(query.category_id) && page === 1
  return buildPageMetadata({
    locale,
    title: t('metadata.title'),
    description: t('metadata.description'),
    path: '/services',
    indexable,
  })
}

function GuidanceCard({ locale, title, description, action }: {
  locale: string
  title: string
  description: string
  action: string
}) {
  return (
    <aside className="grid gap-5 rounded-[14px] border border-emerald-900/15 bg-emerald-950 px-6 py-7 text-white sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6">
      <Compass className="size-8 text-amber-300" aria-hidden="true" />
      <div className="relative mt-4 lg:mt-0">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{description}</p>
      </div>
      <Button asChild className="h-11 rounded-[6px] bg-amber-400 px-5 text-emerald-950 hover:bg-amber-300">
        <Link href={quickServiceRequestHref(locale)}>
          {action}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </Button>
    </aside>
  )
}

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const t = await getTranslations({ locale, namespace: 'servicesPage' })
  const q = (first(query.q) || '').trim().slice(0, 100)
  const categoryId = positiveInteger(first(query.category_id))
  const page = positiveInteger(first(query.page)) || 1
  let catalogue: PublicServicesResponse | null = null

  try {
    catalogue = await getActiveServices({ q, categoryId, page, perPage: 12 })
  } catch {
    // The error state below deliberately keeps KAN-16 reachable.
  }

  const services = catalogue?.services || []
  const pagination = catalogue?.pagination
  const categories = catalogue?.filters.categories || []
  const hasFilters = Boolean(q || categoryId)

  return (
    <div className="min-h-[70vh] bg-[#fbf8f0] py-9 dark:bg-background sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="grid items-end gap-7 border-b border-foreground/10 pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:pb-10">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Wrench className="size-4" aria-hidden="true" />
              {t('eyebrow')}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">{t('title')}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t('description')}</p>
          </div>
          {pagination && (
            <p className="w-fit border-s-2 border-primary ps-4 text-sm font-semibold text-foreground" aria-live="polite">
              {t('resultCount', { count: pagination.total_items })}
            </p>
          )}
        </header>

        <section className="relative z-10 -mt-px rounded-b-[14px] border border-stone-200 bg-card p-4 shadow-[0_16px_40px_-34px_rgba(43,38,28,0.45)] sm:p-5 dark:border-border" aria-labelledby="services-filters-title">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
            <h2 id="services-filters-title" className="text-sm font-bold text-foreground">{t('filters.title')}</h2>
          </div>
          <form action={`/${locale}/services`} method="get" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)_auto] lg:items-end">
            <label className="grid gap-1.5 text-sm font-semibold text-foreground">
              {t('filters.searchLabel')}
              <span className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  suppressHydrationWarning
                  type="search"
                  name="q"
                  defaultValue={q}
                  maxLength={100}
                  placeholder={t('filters.searchPlaceholder')}
                  className="h-11 w-full rounded-[6px] border border-input bg-background px-10 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </span>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-foreground">
              {t('filters.categoryLabel')}
              <select name="category_id" defaultValue={categoryId || ''} className="h-11 w-full rounded-[6px] border border-input bg-background px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20">
                <option value="">{t('filters.allCategories')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{localizedCategoryName(category, locale)}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="h-11 px-5">{t('filters.submit')}</Button>
              {hasFilters && <Button asChild variant="outline" className="h-11"><Link href={`/${locale}/services`}>{t('filters.reset')}</Link></Button>}
            </div>
          </form>
        </section>

        {!catalogue ? (
          <section className="mt-8 rounded-[14px] border border-stone-200 bg-card p-5 shadow-[0_14px_34px_-30px_rgba(41,37,32,.5)] sm:flex sm:items-center sm:gap-5 sm:p-6 dark:border-border" role="alert">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"><Compass className="size-5" aria-hidden="true" /></span>
            <div className="mt-4 min-w-0 flex-1 sm:mt-0"><h2 className="text-lg font-bold text-foreground">{t('error.title')}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{t('error.description')}</p></div>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0"><Button asChild variant="outline" className="min-h-11 rounded-[6px]"><Link href={catalogueHref(locale, { q, category_id: categoryId, page })}>{t('error.retry')}</Link></Button><Button asChild className="min-h-11 rounded-[6px]"><Link href={quickServiceRequestHref(locale)}>{t('guidance.action')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link></Button></div>
          </section>
        ) : services.length === 0 ? (
          <section className="mt-10 border border-dashed border-border bg-card/70 p-8 text-center sm:p-12">
            <Search className="mx-auto size-9 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-foreground">{t('empty.title')}</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t(hasFilters ? 'empty.filteredDescription' : 'empty.description')}</p>
            {hasFilters && <Button asChild variant="outline" className="mt-5"><Link href={`/${locale}/services`}>{t('filters.reset')}</Link></Button>}
          </section>
        ) : (
          <section className="mt-10" aria-label={t('gridLabel')}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  locale={locale}
                  viewLabel={t('card.view')}
                  requestLabel={t('card.request')}
                  moreCategoriesLabel={t('card.moreCategories', {
                    count: Math.max(0, service.categories.length - 2),
                  })}
                />
              ))}
            </div>
            <div className="mt-8"><GuidanceCard locale={locale} title={t('guidance.title')} description={t('guidance.description')} action={t('guidance.action')} /></div>
          </section>
        )}

        {catalogue && services.length === 0 && (
          <div className="mt-8">
            <GuidanceCard locale={locale} title={t('guidance.title')} description={t('guidance.description')} action={t('guidance.action')} />
          </div>
        )}

        {pagination && pagination.total_pages > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label={t('pagination.label')}>
            <Button asChild variant="outline" size="sm" className={!pagination.has_previous ? 'pointer-events-none opacity-45' : ''}>
              <Link aria-disabled={!pagination.has_previous} tabIndex={pagination.has_previous ? undefined : -1} href={catalogueHref(locale, { q, category_id: categoryId, page: Math.max(1, pagination.current_page - 1) })}>
                <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />{t('pagination.previous')}
              </Link>
            </Button>
            {visiblePages(pagination.current_page, pagination.total_pages).map((number, index, pages) => (
              <span key={number} className="contents">
                {index > 0 && number - pages[index - 1] > 1 && <span className="px-1 text-muted-foreground" aria-hidden="true">…</span>}
                <Button asChild size="icon-sm" variant={number === pagination.current_page ? 'default' : 'outline'}>
                  <Link href={catalogueHref(locale, { q, category_id: categoryId, page: number })} aria-current={number === pagination.current_page ? 'page' : undefined} aria-label={t('pagination.page', { page: number })}>{number}</Link>
                </Button>
              </span>
            ))}
            <Button asChild variant="outline" size="sm" className={!pagination.has_next ? 'pointer-events-none opacity-45' : ''}>
              <Link aria-disabled={!pagination.has_next} tabIndex={pagination.has_next ? undefined : -1} href={catalogueHref(locale, { q, category_id: categoryId, page: pagination.current_page + 1 })}>
                {t('pagination.next')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        )}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Compass, Search, Wrench } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ServiceCard } from '@/components/services/service-card'
import { ServicesSearchInput } from '@/components/services/services-search-input'
import { QuickRequestLink } from '@/components/service-requests/quick-request-link'
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

function GuidanceCard({ locale, returnTo, title, description, action }: {
  locale: string
  returnTo: string
  title: string
  description: string
  action: string
}) {
  return (
    <aside className="relative isolate grid gap-5 overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-premium sm:grid-cols-[1fr_auto] sm:items-center sm:gap-10 sm:p-10">
      <div className="bd-grid absolute inset-0 -z-10 opacity-60 [--grid-color:rgba(255,255,255,0.04)]" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(55%_90%_at_100%_0%,rgba(242,159,4,0.28),transparent_70%)]" aria-hidden="true" />
      <div className="max-w-2xl">
        <h2 className="flex items-center gap-3 text-xl font-extrabold tracking-tight sm:text-3xl"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-yellow text-ink shadow-[0_14px_30px_-12px_rgba(242,183,5,0.8)]"><Compass className="size-5" aria-hidden="true" /></span>{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">{description}</p>
      </div>
      <Link href={quickServiceRequestHref(locale, returnTo)} className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-gold ps-6 pe-1.5 text-sm font-bold text-ink shadow-[0_14px_30px_-14px_rgba(242,183,5,0.8)] transition-transform duration-500 hover:-translate-y-0.5">
        {action}
        <span className="grid size-9 place-items-center rounded-full bg-ink text-brand-yellow transition-transform duration-500 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </span>
      </Link>
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
  const returnTo = catalogueHref(locale, { q, category_id: categoryId, page })

  return (
    <div className="min-h-[70vh] bg-background pb-16 lg:pb-24">
      {/* Hero: ink background, grid and gold glow, like the home page sections. */}
      <header className="relative isolate overflow-hidden bg-ink pb-28 pt-12 text-white sm:pt-16 lg:pb-36 lg:pt-20">
        <div className="bd-grid absolute inset-0 -z-10 opacity-70 [--grid-color:rgba(255,255,255,0.04)]" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_70%_at_8%_0%,rgba(242,159,4,0.30),transparent_70%),radial-gradient(35%_60%_at_100%_100%,rgba(242,183,5,0.14),transparent_70%)]" aria-hidden="true" />
        <Wrench className="pointer-events-none absolute -end-10 top-1/2 -z-10 size-[22rem] -translate-y-1/2 -rotate-12 text-white/[0.035] lg:size-[30rem]" strokeWidth={0.8} aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-end gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
          <div className="max-w-3xl">
            <p className="kicker flex items-center gap-3 !text-brand-yellow">
              <span className="h-px w-8 bg-brand-yellow" aria-hidden="true" />
              {t('eyebrow')}
            </p>
            <h1 className="display-lg mt-4 text-[2.3rem] text-white sm:text-5xl lg:text-[4rem]">{t('title')}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65">{t('description')}</p>
            <div className="mt-7"><QuickRequestLink locale={locale} returnTo={returnTo} /></div>
          </div>
          {pagination && (
            <p className="flex w-fit items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.06] px-6 py-5 text-sm font-semibold text-white/85 backdrop-blur-md" aria-live="polite">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow text-ink"><Wrench className="size-5" aria-hidden="true" /></span>
              {t('resultCount', { count: pagination.total_items })}
            </p>
          )}
        </div>
      </header>

      <div className="relative mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:-mt-20 lg:px-8">
        {/* Search: a floating card overlapping the hero. */}
        <section className="rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-premium backdrop-blur-xl sm:p-6" aria-labelledby="services-filters-title">
          <h2 id="services-filters-title" className="sr-only">{t('filters.title')}</h2>
          <form action={`/${locale}/services`} method="get" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)_auto] lg:items-end">
            <label className="grid min-w-0 gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {t('filters.searchLabel')}
              <ServicesSearchInput defaultValue={q} placeholder={t('filters.searchPlaceholder')} />
            </label>
            <label className="grid min-w-0 gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {t('filters.categoryLabel')}
              <select name="category_id" defaultValue={categoryId || ''} className="h-12 w-full rounded-full border border-border bg-background px-4 text-sm font-normal normal-case tracking-normal text-foreground outline-none transition focus:border-brand-orange/70 focus:shadow-[0_0_0_4px_rgba(242,159,4,0.15)]">
                <option value="">{t('filters.allCategories')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{localizedCategoryName(category, locale)}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-full bg-gold px-7 text-sm font-bold text-ink shadow-[0_14px_30px_-14px_rgba(242,183,5,0.8)] transition-transform duration-500 hover:-translate-y-0.5">
                <Search className="size-4" aria-hidden="true" />{t('filters.submit')}
              </button>
              {hasFilters && <Link href={`/${locale}/services`} className="inline-flex h-12 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-accent-text">{t('filters.reset')}</Link>}
            </div>
          </form>
        </section>

        {!catalogue ? (
          <section className="mt-8 rounded-3xl border border-border bg-card p-5 sm:flex sm:items-center sm:gap-5 sm:p-6" role="alert">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow text-ink"><Compass className="size-5" aria-hidden="true" /></span>
            <div className="mt-4 min-w-0 flex-1 sm:mt-0"><h2 className="text-lg font-semibold text-foreground">{t('error.title')}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{t('error.description')}</p></div>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0"><Button asChild variant="outline" className="min-h-11 rounded-full"><Link href={returnTo}>{t('error.retry')}</Link></Button><Button asChild className="min-h-11 rounded-full"><Link href={quickServiceRequestHref(locale, returnTo)}>{t('guidance.action')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link></Button></div>
          </section>
        ) : services.length === 0 ? (
          <section className="mt-10 rounded-[2rem] border border-dashed border-border bg-card p-8 text-center sm:p-12">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-yellow text-ink"><Search className="size-6" aria-hidden="true" /></span>
            <h2 className="mt-4 text-xl font-semibold text-foreground">{t('empty.title')}</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t(hasFilters ? 'empty.filteredDescription' : 'empty.description')}</p>
            {hasFilters && <Button asChild variant="outline" className="mt-5"><Link href={`/${locale}/services`}>{t('filters.reset')}</Link></Button>}
          </section>
        ) : (
          <section className="mt-10" aria-label={t('gridLabel')}>
            <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-9">
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
            <div className="mt-8"><GuidanceCard locale={locale} returnTo={returnTo} title={t('guidance.title')} description={t('guidance.description')} action={t('guidance.action')} /></div>
          </section>
        )}

        {catalogue && services.length === 0 && (
          <div className="mt-8">
            <GuidanceCard locale={locale} returnTo={returnTo} title={t('guidance.title')} description={t('guidance.description')} action={t('guidance.action')} />
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
